/**
 * 慢性病追踪 AI 深度分析服务（会员专属）
 *
 * 流程（参照 symptomAiService / feedingAiService 的成熟模式）：
 *   服务端直接读取 pet_chronic_records（权威数据源，不依赖前端传参）
 *   → 注入宠物档案 + 近 30 天打卡 + 记忆闸门召回（医疗相关）
 *   → aiService.chat 组织话术 → guardCheckOutput 输出安全检测（拦截诊断/用药越界）
 *   → 返回 AI 生成的慢病管理建议（复查提醒/日常护理/饮食配合/就医触发条件）
 *
 * 红线（与症状 AI 一致）：不做诊断、不推荐具体药物剂量、强制免责声明；
 * 慢性病记录来自用户自己录入（含兽医诊断信息），AI 只做"管理建议"而非诊断。
 */
import { pool } from '../db.js';
import { PetRepository } from '../repositories/petRepository.js';
import { ChronicRepository } from '../repositories/chronicRepository.js';
import { chat, guardCheckOutput } from './aiService.js';

const petRepository = new PetRepository();
const chronicRepository = new ChronicRepository();

/** 慢性病 AI 分析请求体（最小输入：宠物归属由路由校验，数据从 DB 读取） */
export interface AiChronicAnalysisInput {
  /** 前端希望 AI 聚焦的方向（可选，用于 prompt 定制） */
  focus?: string;
}

/** AI 慢病管理建议结果 */
export interface AiChronicAnalysisResult {
  aiAdvice: string;               // AI 组织的慢病管理建议（含免责声明）
  memoriesUsed: Array<{ content: string; importance: number; category: string }>;
  unsafe: boolean;                // 输出安全检测是否拦截
  degraded?: boolean;             // LLM 调用失败降级
}

/** 免责声明 */
const DISCLAIMER = '⚠️ 以上为 AI 辅助分析，仅供参考，不替代兽医诊断与医嘱。请遵医嘱用药并按时复查。';

/** 计算宠物年龄（月） */
function calcAgeMonths(birthDate: string): number {
  const birth = new Date(birthDate + 'T00:00:00.000Z');
  const now = new Date();
  return Math.max(
    (now.getUTCFullYear() - birth.getUTCFullYear()) * 12 + (now.getUTCMonth() - birth.getUTCMonth()),
    0,
  );
}

/** 日期格式化（pg TIMESTAMPTZ → YYYY-MM-DD） */
function formatDate(d: unknown): string {
  if (d instanceof Date && !Number.isNaN(d.getTime())) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return String(d).slice(0, 10);
}

/** 严重程度中文 */
const SEVERITY_TEXT: Record<string, string> = { mild: '轻度', moderate: '中度', severe: '重度' };
/** 状态中文 */
const STATUS_TEXT: Record<string, string> = { active: '管理中', managed: '已控制', resolved: '已康复' };

/**
 * 构建系统提示词：注入红线、宠物档案、慢病记录、打卡、记忆
 */
function buildPrompt(
  petProfileText: string,
  chronicText: string,
  checkinText: string,
  memoryTextBlock: string,
  focus?: string,
): string {
  return [
    '你是星河宠记的宠物慢病管理助手。请根据给定信息，为该宠物的慢性病给出可执行的日常管理建议（3-6 条，简洁口语化）。',
    '',
    '## 铁律（必须严格遵守）',
    '1. 不重复"诊断"，不做病情判断升级；涉及疾病只说"该病通常需注意…"',
    '2. 不推荐具体药物、剂量（已有用药信息仅作背景，可提示"遵医嘱用药"）',
    '3. 必须给出：日常护理要点、复查提醒、出现哪些症状应立即就医',
    '4. 结尾附免责声明',
    '',
    '## 宠物档案',
    petProfileText,
    '## 慢性病记录（用户录入，含兽医诊断）',
    chronicText,
    checkinText ? `## 近30天健康打卡\n${checkinText}` : '',
    memoryTextBlock ? `## 历史记忆（医疗/健康相关，仅供参考背景）\n${memoryTextBlock}` : '',
    focus ? `## 用户关注点\n${focus.slice(0, 100)}` : '',
    '',
    '## 输出要求',
    '直接输出建议列表（每条用"1. "编号），不要输出 JSON 或多余解释。',
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * 慢性病 AI 主流程
 * @param userId - 用户 ID
 * @param petId - 宠物 ID
 * @param input - 分析输入（focus 可选）
 */
export async function analyzeChronicAdvice(
  userId: string,
  petId: string,
  input: AiChronicAnalysisInput,
): Promise<AiChronicAnalysisResult> {
  // 1. 宠物档案
  const pet = await petRepository.findByIdAndUser(petId, userId);

  // 2. 慢性病记录（权威数据源）
  const chronicRows = await chronicRepository.findByPet(petId, userId);
  const activeChronic = chronicRows.filter((r) => r.status !== 'resolved');

  // 无慢病记录时直接返回提示（不浪费 LLM 调用）
  if (activeChronic.length === 0) {
    return {
      aiAdvice: '当前没有需要管理的慢性病记录。可先添加慢性病信息（如确诊的疾病、复查日期、用药情况），即可获得 AI 管理建议。',
      memoriesUsed: [],
      unsafe: false,
    };
  }

  // 3. 近 30 天打卡（真实数据）
  const checkinRows = await pool.query(
    `SELECT spirit_level, appetite_level, poop_level, exercise_level, weight, note, created_at
     FROM pet_health_entries
     WHERE pet_id = $1 AND user_id = $2 AND created_at >= NOW() - INTERVAL '30 days'
     ORDER BY created_at ASC`,
    [petId, userId],
  );

  // 4. 记忆闸门召回（医疗相关）
  const { recallHealthMemories } = await import('./memoryService.js');
  const memories = await recallHealthMemories(userId, petId, ['慢性病', '复查', '用药', '就医', ...activeChronic.map((c) => c.condition)], 5);
  const memoriesUsed = memories.map((m) => ({
    content: m.content,
    importance: m.importance,
    category: m.category,
  }));

  // 5. 组装上下文文本（用户可控内容一律截断）
  const petName = pet?.name?.slice(0, 30) || '我的宠物';
  const petProfileText = pet
    ? [
        `- 名字：${pet.name.slice(0, 30)}`,
        `- 物种/品种：${pet.species === 'dog' ? '犬' : '猫'}${pet.breed ? `（${pet.breed.slice(0, 30)}）` : ''}`,
        pet.birth_date ? `- 年龄：${calcAgeMonths(pet.birth_date)} 个月` : '',
        pet.weight ? `- 体重：${pet.weight}kg` : '',
      ]
        .filter(Boolean)
        .join('\n')
    : '（暂无档案）';

  const chronicText = activeChronic
    .map((c) => {
      const parts = [
        `- ${c.condition.slice(0, 50)}（${SEVERITY_TEXT[c.severity] || c.severity}，${STATUS_TEXT[c.status] || c.status}）`,
        `  确诊：${formatDate(c.diagnosed_date)}`,
      ];
      if (c.medications && c.medications.length > 0) {
        parts.push(`  用药：${(c.medications as unknown as string[]).slice(0, 10).join('、').slice(0, 200)}（遵医嘱）`);
      }
      if (c.next_checkup_date) {
        parts.push(`  下次复查：${formatDate(c.next_checkup_date)}`);
      }
      if (c.symptoms && (c.symptoms as unknown as string[]).length > 0) {
        parts.push(`  关注症状：${(c.symptoms as unknown as string[]).slice(0, 10).join('、').slice(0, 200)}`);
      }
      if (c.notes) {
        parts.push(`  备注：${String(c.notes).slice(0, 100)}`);
      }
      return parts.join('\n');
    })
    .join('\n');

  const checkinText =
    checkinRows.rows.length > 0
      ? checkinRows.rows
          .map(
            (r) =>
              `- ${formatDate(r.created_at)}：精神${r.spirit_level}/食欲${r.appetite_level}/排便${r.poop_level}/运动${r.exercise_level}${r.note ? `，备注：${String(r.note).slice(0, 50)}` : ''}`,
          )
          .join('\n')
      : '';

  // 6. 调 LLM（失败降级返回，不抛 500）
  let raw = '';
  try {
    raw = (
      (await chat(
        [
          {
            role: 'system',
            content: buildPrompt(petProfileText, chronicText, checkinText, memoryText(memoriesUsed), input.focus),
          },
          { role: 'user', content: `请为${petName}的慢性病管理给出建议。` },
        ],
        { temperature: 0.6, max_tokens: 800, thinking: 'disabled' },
      )) ?? ''
    ).trim();
  } catch {
    return {
      aiAdvice: `AI 慢病管理建议暂时不可用，请稍后再试。${DISCLAIMER}`,
      memoriesUsed,
      unsafe: false,
      degraded: true,
    };
  }

  // 7. 输出安全检测（fail-closed；care 场景：允许"就医提醒/遵医嘱"，只拦真危险内容）
  const guard = await guardCheckOutput(raw, { failClosed: true, scope: 'care' });
  if (guard.isUnsafeMedicalAdvice) {
    return {
      aiAdvice: `本次 AI 慢病管理建议因安全校验未通过已被拦截。${DISCLAIMER}`,
      memoriesUsed,
      unsafe: true,
    };
  }

  return {
    aiAdvice: `${raw}\n\n${DISCLAIMER}`,
    memoriesUsed,
    unsafe: false,
  };
}

/** 记忆文本组装 */
function memoryText(memories: Array<{ content: string; importance: number; category: string }>): string {
  if (memories.length === 0) return '';
  return memories
    .map((m) => `- [${m.category === 'medical' ? '医疗' : '健康'}] ${m.content}（重要度：${m.importance}）`)
    .join('\n');
}
