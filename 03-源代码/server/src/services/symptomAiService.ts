/**
 * 症状 AI 深度分析服务（Phase 2，会员专属）
 *
 * 流程（见 设计方案-2026-08-22 第六/七章）：
 *   前端本地初筛结论（规则+图谱依据）→ 服务端注入宠物档案 + 近7天打卡 + 记忆闸门召回
 *   → aiService.chat 组织话术 → guardCheckOutput 输出安全检测（拦截诊断/用药越界）
 *
 * 红线（与设计文档一致）：不做诊断、不推荐用药、强制免责声明；
 * 记忆/打卡只作背景（basis='record'），不改变 riskLevel（riskLevel 由前端规则引擎产出）。
 */
import { pool } from '../db.js';
import { PetRepository } from '../repositories/petRepository.js';
import { chat, guardCheckOutput } from './aiService.js';
import { recallHealthMemories } from './memoryService.js';

const petRepository = new PetRepository();

/** AI 深度分析请求体（由前端本地结论 + 症状信息构成） */
export interface AiSymptomAnalysisInput {
  symptoms: string[];        // 症状 ID（英文，如 'vomiting'）
  symptomNames: string[];    // 症状中文名（供 prompt 与记忆召回）
  riskLevel: 'normal' | 'caution' | 'warning' | 'emergency';
  possibleConditions: string[];
  conclusions: Array<{ text: string; basis: string; confidence: string }>;
  duration?: string;
  severity?: string;
}

/** 记忆召回条目（仅用于展示背景，basis='record'） */
export interface RecalledMemory {
  content: string;
  importance: number;
  category: string;
}

/** AI 深度分析结果 */
export interface AiSymptomAnalysisResult {
  aiAdvice: string;               // AI 组织后的建议（含免责声明）
  memoriesUsed: RecalledMemory[]; // 记忆召回（只作展示）
  unsafe: boolean;                // 输出安全检测是否拦截（true 时 aiAdvice 为兜底文案）
  degraded?: boolean;             // LLM 调用失败降级（true 时 aiAdvice 为"稍后再试"兜底文案）
}

/** 免责声明（沿用 PRD 8.4 宠物管家免责模板） */
const DISCLAIMER = '⚠️ 以上为 AI 辅助分析，仅供参考，不替代专业兽医诊断。宠物出现紧急症状请立即就医。';

/** 风险等级中文文案（供 prompt 使用） */
const RISK_TEXT: Record<string, string> = {
  normal: '状态良好（观察即可）',
  caution: '注意观察',
  warning: '密切观察（建议尽快就医）',
  emergency: '紧急（应立即就医）',
};

/** 计算宠物年龄（月），用于 prompt 个性化 */
function calcAgeMonths(birthDate: string): number {
  const birth = new Date(birthDate + 'T00:00:00.000Z');
  const now = new Date();
  return Math.max(
    (now.getUTCFullYear() - birth.getUTCFullYear()) * 12 + (now.getUTCMonth() - birth.getUTCMonth()),
    0,
  );
}

/**
 * 打卡日期格式化（审查项修复）
 * pg 的 TIMESTAMPTZ 返回 Date 对象，String(Date).slice(0,10) 会产出 "Thu Aug 20" 之类乱码，
 * 统一转为 YYYY-MM-DD（UTC），无法解析时回退字符串截断
 * 导出供 routes/symptoms.ts 恢复事件记忆复用
 */
export function formatDate(d: unknown): string {
  if (d instanceof Date && !Number.isNaN(d.getTime())) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return String(d).slice(0, 10);
}

/** 记忆文本组装（供 prompt 的"历史记忆"段） */
function memoryText(memories: RecalledMemory[]): string {
  if (memories.length === 0) return '';
  return memories
    .map((m) => `- [${m.category === 'medical' ? '医疗' : '健康'}] ${m.content}（重要度：${m.importance}）`)
    .join('\n');
}

/**
 * 构建系统提示词：注入红线、宠物档案、初筛结论、打卡、记忆
 * 红线指令是硬约束（不做诊断/不推荐用药），由 guardCheckOutput 做第二道兜底
 */
function buildPrompt(
  petProfileText: string,
  input: AiSymptomAnalysisInput,
  checkinText: string,
  memoryTextBlock: string,
): string {
  return [
    '你是星河宠记的宠物健康分诊助手。请根据给定信息，为用户宠物当前的症状给出温暖、简洁的建议（3-5 句）。',
    '',
    '## 铁律（必须严格遵守）',
    '1. 绝对不做医学诊断：不得输出"得了XX病"式结论，只能说"可能相关/建议排查/建议就医"',
    '2. 绝对不推荐具体药物、剂量、处方',
    '3. 必须给出观察建议与就医触发条件（如"症状持续超过24小时请就医"）',
    '4. 结尾附免责声明',
    '',
    '## 宠物档案',
    petProfileText,
    '## 当前初筛结果（规则引擎产出，不可更改）',
    // 症状名为用户可控内容，截断到 30 字符/条，防止超长注入面（审查项修复）
    `- 症状：${input.symptomNames.map((n) => n.slice(0, 30)).join('、')}${input.duration ? `（${input.duration}）` : ''}${input.severity ? `，严重程度：${input.severity}` : ''}`,
    `- 风险等级：${RISK_TEXT[input.riskLevel] || input.riskLevel}`,
    input.possibleConditions.length > 0
      ? `- 可能相关排查方向：${input.possibleConditions.join('、')}（仅供参考，不构成诊断）`
      : '',
    input.conclusions.length > 0
      ? `- 规则/图谱结论：${input.conclusions.map((c) => c.text).join('；')}`
      : '',
    '',
    checkinText ? `## 近7天健康打卡\n${checkinText}` : '',
    memoryTextBlock ? `## 历史记忆（健康/医疗相关，仅供参考背景）\n${memoryTextBlock}` : '',
    '',
    '## 输出要求',
    '直接输出建议文本，不要输出 JSON 或多余解释。',
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * 深度分析主流程
 * @param userId - 用户 ID
 * @param petId - 宠物 ID
 * @param input - 前端本地初筛结论
 * @returns AI 建议 + 记忆召回 + 安全拦截标记
 */
export async function deepAnalyzeSymptom(
  userId: string,
  petId: string,
  input: AiSymptomAnalysisInput,
): Promise<AiSymptomAnalysisResult> {
  // 1. 宠物档案（用于 prompt 个性化）
  const pet = await petRepository.findByIdAndUser(petId, userId);

  // 2. 近 7 天打卡（真实数据，basis='record'）
  const checkinRows = await pool.query(
    `SELECT spirit_level, appetite_level, poop_level, exercise_level, weight, note, created_at
     FROM pet_health_entries
     WHERE pet_id = $1 AND user_id = $2 AND created_at >= NOW() - INTERVAL '7 days'
     ORDER BY created_at ASC`,
    [petId, userId],
  );

  // 3. 记忆闸门召回（health/medical + active + importance≥5 + 近90天 + 关键词，见 memoryService.recallHealthMemories）
  const memories = await recallHealthMemories(userId, petId, [...input.symptomNames, '症状', '就医', '生病'], 5);
  const memoriesUsed: RecalledMemory[] = memories.map((m) => ({
    content: m.content,
    importance: m.importance,
    category: m.category,
  }));

  // 4. 组装上下文文本（用户可控内容一律截断，防止注入面过大，审查项修复）
  const petName = pet?.name?.slice(0, 30) || '我的宠物';
  const petProfileText = pet
    ? [
        `- 名字：${pet.name.slice(0, 30)}`,
        `- 物种/品种：${pet.species === 'dog' ? '犬' : '猫'}${pet.breed ? `（${pet.breed.slice(0, 30)}）` : ''}`,
        pet.birth_date ? `- 年龄：${calcAgeMonths(pet.birth_date)} 个月` : '',
        pet.weight ? `- 体重：${pet.weight}kg` : '',
        pet.is_neutered ? '- 已绝育' : '',
        pet.notes ? `- 备注：${pet.notes.slice(0, 100)}` : '',
      ]
        .filter(Boolean)
        .join('\n')
    : '（暂无档案）';

  const checkinText =
    checkinRows.rows.length > 0
      ? checkinRows.rows
          .map(
            (r) =>
              `- ${formatDate(r.created_at)}：精神${r.spirit_level}/食欲${r.appetite_level}/排便${r.poop_level}/运动${r.exercise_level}${r.note ? `，备注：${String(r.note).slice(0, 50)}` : ''}`,
          )
          .join('\n')
      : '';

  // 5. 调 LLM（关闭思考模式，避免 max_tokens 被 reasoning 吃掉导致内容截断）
  //    LLM 失败/超时 → 降级返回（fail-safe，不抛 500 打断主流程，审查项修复）
  let raw = '';
  try {
    raw = (
      (await chat(
        [
          {
            role: 'system',
            content: buildPrompt(petProfileText, input, checkinText, memoryText(memoriesUsed)),
          },
          { role: 'user', content: `请为${petName}当前的症状给出建议。` },
        ],
        { temperature: 0.5, max_tokens: 800, thinking: 'disabled' },
      )) ?? ''
    ).trim();
  } catch {
    return {
      aiAdvice: `AI 深度分析暂时不可用，请稍后再试。${DISCLAIMER}`,
      memoriesUsed,
      unsafe: false,
      degraded: true,
    };
  }

  // 6. 输出安全检测（fail-closed：检测服务异常时宁可拦截，不可放行，审查项修复）
  const guard = await guardCheckOutput(raw, { failClosed: true });
  if (guard.isUnsafeMedicalAdvice) {
    return {
      aiAdvice: `本次深度分析因安全校验未通过已被拦截。${DISCLAIMER}`,
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
