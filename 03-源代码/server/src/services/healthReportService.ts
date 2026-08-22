/**
 * 体检报告识别服务（回忆录 2.0 F8：Agent 识图能力落地）
 * 流程：体检报告图片 → visionService（DeepSeek 视觉）→ 结构化指标 → 存 health_reports → 写健康事件记忆
 *
 * 后续：Agent 可通过 get_health_reports 工具查询并解读（结合记忆给出结论与行动建议）
 */
import { randomUUID } from 'node:crypto';
import { pool } from '../db.js';
import { analyzeImage, extractJsonFromText } from './visionService.js';
import { recordHealthMemory } from './memoryService.js';

/** 体检指标（结构化） */
export interface HealthMetric {
  /** 指标名（如"白细胞"） */
  name: string;
  /** 数值（保留原始字符串，避免单位换算错误） */
  value: string;
  /** 单位 */
  unit?: string;
  /** 参考范围（如"5.5-19.5"） */
  range?: string;
  /** 是否超出参考范围 */
  abnormal?: boolean;
}

/** 识别结果 */
export interface HealthReportResult {
  id: string;
  metrics: HealthMetric[];
  rawText: string;
  /** 是否有异常指标 */
  hasAbnormal: boolean;
}

/** 体检识别系统提示词（要求结构化 JSON） */
export const HEALTH_REPORT_PROMPT = `你是宠物体检报告识别助手。识别图中宠物体检报告的各项指标。
输出严格 JSON（不要其他文字）：
{
  "metrics": [
    {"name": "指标名", "value": "数值", "unit": "单位", "range": "参考范围", "abnormal": true或false}
  ],
  "rawText": "报告中的关键原始文本（如宠物名、检查日期、异常提示）"
}
规则：
- abnormal=true 表示该指标超出参考范围（偏高或偏低）
- 无法识别的指标跳过；全无法识别则 metrics 为空数组
- 只输出 JSON`;

/**
 * 识别体检报告（图片 → 指标 → 存表 → 写健康记忆）
 * @param params - 识别参数
 * @returns 识别结果；视觉降级（无 key/无结果）返回 null
 */
export async function recognizeHealthReport(params: {
  userId: string;
  petId: string;
  /** 图片 data URL（前端上传后转） */
  imageDataUrl: string;
  /** 体检日期（可选，用户选择） */
  reportDate?: string;
}): Promise<HealthReportResult | null> {
  // 1. 视觉识别
  const raw = await analyzeImage({
    imageUrl: params.imageDataUrl,
    prompt: HEALTH_REPORT_PROMPT,
    maxTokens: 800,
  });
  const parsed = extractJsonFromText(raw);
  if (!parsed) {
    console.warn('[HealthReport] 识别结果无有效 JSON，返回空（可提示用户手动录入）');
    return null;
  }

  const metrics = Array.isArray(parsed.metrics)
    ? (parsed.metrics as HealthMetric[]).filter((m) => m && typeof m.name === 'string' && m.name)
    : [];
  const rawText = typeof parsed.rawText === 'string' ? parsed.rawText.slice(0, 1000) : '';

  const id = randomUUID();
  const hasAbnormal = metrics.some((m) => m.abnormal === true);

  // 2. 存表
  await pool.query(
    `INSERT INTO health_reports (id, user_id, pet_id, report_date, metrics, raw_text, source, memory_key)
     VALUES ($1, $2, $3, $4, $5, $6, 'vision', $7)`,
    [
      id,
      params.userId,
      params.petId,
      params.reportDate || null,
      JSON.stringify(metrics),
      rawText,
      `health_report:${id}`,
    ],
  );

  // 3. 写健康事件记忆（有异常指标时 importance 高）
  if (metrics.length > 0) {
    const abnormalText = metrics.filter((m) => m.abnormal).map((m) => `${m.name}${m.value}`).join('、');
    const summary = hasAbnormal
      ? `体检发现异常：${abnormalText || '多项指标异常'}`
      : `体检完成：${metrics.length} 项指标在参考范围内`;
    await recordHealthMemory({
      userId: params.userId,
      petId: params.petId,
      category: 'medical',
      content: `${new Date().toLocaleDateString('zh-CN')} ${summary}（报告 ${id.slice(0, 8)}）`,
      importance: hasAbnormal ? 8 : 6,
      evidence: `health_report:${id}`,
    });
  }

  return { id, metrics, rawText, hasAbnormal };
}

/**
 * 查询宠物体检记录（Agent 工具用）
 * @param petId - 宠物 ID
 * @param userId - 用户 ID（归属校验）
 * @param limit - 条数
 * @returns 体检记录列表（按时间倒序）
 */
export async function listHealthReports(petId: string, userId: string, limit = 5): Promise<Array<Record<string, unknown>>> {
  const { rows } = await pool.query(
    `SELECT id, report_date, metrics, raw_text, created_at
     FROM health_reports
     WHERE pet_id = $1 AND user_id = $2
     ORDER BY created_at DESC LIMIT $3`,
    [petId, userId, limit],
  );
  return rows;
}
