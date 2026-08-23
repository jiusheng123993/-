/**
 * 慢性病风险扫描服务（会员专属）
 *
 * 目标：让慢性病追踪从"手动建档"升级为"主动预警"。
 *
 * 两层机制：
 *   L2 规则预警（确定性，不依赖 LLM）：
 *     基于近 90 天打卡数据，用固定规则识别风险信号——
 *     ① 高风险打卡频率（risk_level = high/emergency 次数占比）
 *     ② 体重异常趋势（持续下降/上升超阈值）
 *     ③ 同种异常持续（同一异常项连续出现天数）
 *   L3 AI 疑似识别（LLM，辅助）：
 *     把打卡摘要 + 历史记忆注入 LLM，识别"可能指向慢性病的模式"，
 *     只输出"疑似/建议兽医排查"，绝不诊断（guard 输出检测兜底）。
 *
 * 安全红线（与症状 AI 一致）：AI 只做"疑似/建议排查"，不输出确诊结论；
 * 慢性病的确诊必须由兽医完成。输出经 guardCheckOutput(care 场景) 检测。
 */
import { pool } from '../db.js';
import { PetRepository } from '../repositories/petRepository.js';
import { chat, guardCheckOutput } from './aiService.js';

const petRepository = new PetRepository();

/** 打卡数据行（pet_health_entries 关键字段） */
export interface CheckinRow {
  weight: string | null;
  spirit_level: number;
  appetite_level: number;
  poop_level: number;
  exercise_level: number;
  note: string | null;
  created_at: Date;
  risk_level: string;
}

/** 风险信号（L2 规则产出） */
export interface RiskSignal {
  type: 'high_risk_frequency' | 'weight_abnormal' | 'persistent_anomaly';
  title: string;        // 信号标题（如"体重持续下降"）
  detail: string;       // 具体说明（含数据）
  level: 'info' | 'warning' | 'alert';  // 严重程度
  suggestedCondition?: string;  // 可能相关的慢病方向（仅"疑似"）
  relatedDates: string[];  // 相关日期
}

/** 风险扫描结果 */
export interface ChronicRiskScanResult {
  signals: RiskSignal[];       // L2 规则预警
  aiInsight: string;           // L3 AI 疑似识别（含免责声明；无风险时为鼓励文案）
  unsafe: boolean;             // AI 输出安全检测是否拦截
  degraded?: boolean;          // LLM 调用失败降级
  memoriesUsed?: Array<{ content: string; importance: number; category: string }>;  // 记忆召回（展示用）
  scanDate: string;            // 扫描日期
}

/** 免责声明 */
const DISCLAIMER = '⚠️ 以上预警为 AI 辅助分析，仅供参考，不构成诊断。宠物异常请及时就医，慢病确诊需由兽医完成。';

/** 日期格式化 */
function formatDate(d: unknown): string {
  if (d instanceof Date && !Number.isNaN(d.getTime())) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return String(d).slice(0, 10);
}

/** 计算宠物年龄（月） */
function calcAgeMonths(birthDate: string): number {
  const birth = new Date(birthDate + 'T00:00:00.000Z');
  const now = new Date();
  return Math.max(
    (now.getUTCFullYear() - birth.getUTCFullYear()) * 12 + (now.getUTCMonth() - birth.getUTCMonth()),
    0,
  );
}

/** 打卡摘要文本（供 L3 AI prompt） */
function buildCheckinSummary(rows: CheckinRow[], limit = 30): string {
  if (rows.length === 0) return '';
  return rows
    .slice(0, limit)
    .map(
      (r) =>
        `- ${formatDate(r.created_at)}：精神${r.spirit_level}/食欲${r.appetite_level}/排便${r.poop_level}/运动${r.exercise_level}${r.weight ? `，体重${r.weight}kg` : ''}${r.risk_level === 'high' || r.risk_level === 'emergency' ? `，风险：${r.risk_level}` : ''}${r.note ? `，备注：${String(r.note).slice(0, 50)}` : ''}`,
    )
    .join('\n');
}

/**
 * L2 规则预警：基于打卡数据识别确定性风险信号
 * @param rows - 近 90 天打卡（升序）
 * @returns 风险信号列表
 */
export function ruleBasedSignals(rows: CheckinRow[]): RiskSignal[] {
  const signals: RiskSignal[] = [];
  if (rows.length < 3) return signals; // 数据太少不预警，避免误报

  // —— ① 高风险打卡频率 ——
  const highRisk = rows.filter((r) => r.risk_level === 'high' || r.risk_level === 'emergency');
  const highRiskRatio = highRisk.length / rows.length;
  if (highRiskRatio >= 0.3 && highRisk.length >= 5) {
    signals.push({
      type: 'high_risk_frequency',
      title: '高风险打卡频繁',
      detail: `近${rows.length}天打卡中，有 ${highRisk.length} 天（${(highRiskRatio * 100).toFixed(0)}%）被评为高风险/紧急，健康状况持续不稳定。`,
      level: 'alert',
      relatedDates: highRisk.slice(-5).map((r) => formatDate(r.created_at)),
    });
  } else if (highRiskRatio >= 0.15 && highRisk.length >= 3) {
    signals.push({
      type: 'high_risk_frequency',
      title: '健康风险偏多',
      detail: `近${rows.length}天有 ${highRisk.length} 天（${(highRiskRatio * 100).toFixed(0)}%）被评为高风险，建议关注并排查原因。`,
      level: 'warning',
      relatedDates: highRisk.slice(-3).map((r) => formatDate(r.created_at)),
    });
  }

  // —— ② 体重异常趋势（取有体重记录的点） ——
  const weightRows = rows.filter((r) => r.weight !== null && parseFloat(r.weight) > 0);
  if (weightRows.length >= 3) {
    const first = parseFloat(weightRows[0].weight as string);
    const last = parseFloat(weightRows[weightRows.length - 1].weight as string);
    if (first > 0) {
      const changePct = ((last - first) / first) * 100;
      const dates = weightRows.map((r) => formatDate(r.created_at));
      if (changePct <= -10) {
        signals.push({
          type: 'weight_abnormal',
          title: '体重明显下降',
          detail: `近${weightRows.length}次记录体重从 ${first}kg 降至 ${last}kg（-${Math.abs(changePct).toFixed(1)}%），持续下降可能提示代谢/消化/内分泌问题，建议兽医排查。`,
          level: 'alert',
          suggestedCondition: '可能与代谢或消化系统问题相关（疑似，待排查）',
          relatedDates: dates,
        });
      } else if (changePct >= 15) {
        signals.push({
          type: 'weight_abnormal',
          title: '体重明显上升',
          detail: `近${weightRows.length}次记录体重从 ${first}kg 升至 ${last}kg（+${changePct.toFixed(1)}%），快速增重可能提示内分泌或代谢问题，建议兽医评估。`,
          level: 'warning',
          suggestedCondition: '可能与内分泌或代谢问题相关（疑似，待排查）',
          relatedDates: dates,
        });
      }
    }
  }

  // —— ③ 同种异常持续（食欲/精神/排便连续异常天数） ——
  const anomalyRun = (level: number, badThreshold: number, label: string): number => {
    let run = 0;
    for (let i = rows.length - 1; i >= 0; i--) {
      if (rows[i].appetite_level <= badThreshold || rows[i].spirit_level <= badThreshold || rows[i].poop_level <= badThreshold) {
        run++;
      } else {
        break;
      }
    }
    return run;
  };
  const runDays = anomalyRun(2, 2, '异常');
  if (runDays >= 3) {
    signals.push({
      type: 'persistent_anomaly',
      title: `连续 ${runDays} 天状态异常`,
      detail: `近 ${runDays} 天食欲/精神/排便持续低于正常水平（评分≤2），连续异常提示可能正在发展成慢性问题，建议记录并咨询兽医。`,
      level: 'warning',
      suggestedCondition: '可能与消化/精神/慢性炎症相关（疑似，待排查）',
      relatedDates: rows.slice(-runDays).map((r) => formatDate(r.created_at)),
    });
  }

  return signals;
}

/**
 * 构建 L3 AI prompt：注入红线、宠物档案、打卡摘要、预警信号、记忆
 */
function buildPrompt(
  petProfileText: string,
  checkinSummary: string,
  signalsText: string,
  memoryTextBlock: string,
): string {
  return [
    '你是星河宠记的宠物健康风险筛查助手。请根据打卡记录和风险信号，判断是否存在"可能指向慢性病"的持续模式（3-5 条，简洁口语化）。',
    '',
    '## 铁律（必须严格遵守）',
    '1. 绝不说"确诊XX病"；只能说"疑似/可能与XX相关，建议兽医排查"',
    '2. 不推荐具体药物、剂量',
    '3. 若数据正常则明确说"暂未发现明显慢病风险"',
    '4. 结尾附免责声明',
    '',
    '## 宠物档案',
    petProfileText,
    checkinSummary ? `## 近90天打卡摘要\n${checkinSummary}` : '',
    signalsText ? `## 规则预警信号（已识别，供参考）\n${signalsText}` : '',
    memoryTextBlock ? `## 历史记忆（健康/医疗相关，仅供参考）\n${memoryTextBlock}` : '',
    '',
    '## 输出要求',
    '直接输出分析文本，不要输出 JSON 或多余解释。',
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * 慢性病风险扫描主流程
 * @param userId - 用户 ID
 * @param petId - 宠物 ID
 */
export async function scanChronicRisk(
  userId: string,
  petId: string,
): Promise<ChronicRiskScanResult> {
  const scanDate = new Date().toISOString().slice(0, 10);

  // 1. 宠物档案
  const pet = await petRepository.findByIdAndUser(petId, userId);

  // 2. 近 90 天打卡（权威数据）
  const checkinResult = await pool.query(
    `SELECT weight, spirit_level, appetite_level, poop_level, exercise_level, note, created_at, risk_level
     FROM pet_health_entries
     WHERE pet_id = $1 AND user_id = $2 AND created_at >= NOW() - INTERVAL '90 days'
     ORDER BY created_at ASC`,
    [petId, userId],
  );
  const rows = checkinResult.rows as CheckinRow[];

  // 3. L2 规则预警（确定性）
  const signals = ruleBasedSignals(rows);

  // 4. 记忆闸门召回（健康/医疗相关）
  const { recallHealthMemories } = await import('./memoryService.js');
  const memories = await recallHealthMemories(userId, petId, ['慢性', '反复', '持续', '异常'], 5);
  const memoriesUsed = memories.map((m) => ({
    content: m.content,
    importance: m.importance,
    category: m.category,
  }));

  // 5. 组装上下文
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

  const checkinSummary = buildCheckinSummary(rows);
  const signalsText =
    signals.length > 0
      ? signals.map((s) => `- [${s.level}] ${s.title}：${s.detail}`).join('\n')
      : '（无）';

  // 无打卡数据时，L3 直接返回引导文案（不浪费 LLM）
  if (rows.length === 0) {
    return {
      signals,
      aiInsight: '还没有足够的打卡数据用于慢病风险分析。建议坚持每日打卡（记录食欲/精神/排便/体重），积累数据后即可获得更准确的风险提示。',
      unsafe: false,
      scanDate,
    };
  }

  // 6. 调 LLM（fail-safe：失败降级，不抛 500）
  let raw = '';
  try {
    raw = (
      (await chat(
        [
          {
            role: 'system',
            content: buildPrompt(petProfileText, checkinSummary, signalsText, memoryText(memoriesUsed)),
          },
          { role: 'user', content: `请分析${petName}近期的健康数据，判断是否有慢性病风险。` },
        ],
        { temperature: 0.5, max_tokens: 800, thinking: 'disabled' },
      )) ?? ''
    ).trim();
  } catch {
    return {
      signals,
      aiInsight: `AI 风险分析暂时不可用，请稍后再试。${DISCLAIMER}`,
      memoriesUsed,
      unsafe: false,
      degraded: true,
      scanDate,
    };
  }

  // 7. 输出安全检测（care 场景规则检测：拦处方药名/确诊式结论）
  const guard = await guardCheckOutput(raw, { failClosed: true, scope: 'care' });
  if (guard.isUnsafeMedicalAdvice) {
    return {
      signals,
      aiInsight: `本次 AI 风险分析因安全校验未通过已被拦截。${DISCLAIMER}`,
      memoriesUsed,
      unsafe: true,
      scanDate,
    };
  }

  return {
    signals,
    aiInsight: `${raw}\n\n${DISCLAIMER}`,
    memoriesUsed,
    unsafe: false,
    scanDate,
  };
}

/** 记忆文本组装 */
function memoryText(memories: Array<{ content: string; importance: number; category: string }>): string {
  if (memories.length === 0) return '';
  return memories
    .map((m) => `- [${m.category === 'medical' ? '医疗' : '健康'}] ${m.content}（重要度：${m.importance}）`)
    .join('\n');
}
