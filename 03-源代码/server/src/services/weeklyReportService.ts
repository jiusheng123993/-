/**
 * 家庭周报业务服务层 - 编排家庭周报的核心业务逻辑
 * 职责：家庭归属校验、周报列表分页、最新周报、详情查询、手动生成
 * 骨架阶段：report_data 使用 mock 数据，ai_insight 和 share_card_url 为 null
 * 所有操作前先验证 family_id 属于当前用户，防止跨用户越权
 */
import { pool } from '../db.js';
import { WeeklyReportRepository, type WeeklyReportRow } from '../repositories/weeklyReportRepository.js';

/** 周报列表查询参数 */
export interface WeeklyReportQueryInput {
  page: number;
  page_size: number;
  year?: number;
}

/** 分页列表响应 */
export interface WeeklyReportListResponse {
  items: WeeklyReportRow[];
  total: number;
  page: number;
  page_size: number;
}

/** 业务错误（带状态码，供路由层捕获） */
export class WeeklyReportError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'WeeklyReportError';
  }
}

const weeklyReportRepository = new WeeklyReportRepository();

/**
 * 校验家庭归属权 - 防横向越权
 * 直接 SQL 查询，与 feedService.ts 一致
 */
async function verifyFamilyOwnership(familyId: string, userId: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT 1 FROM pet_families WHERE id = $1 AND user_id = $2',
    [familyId, userId],
  );
  return (result.rowCount ?? 0) > 0;
}

/**
 * 计算 ISO 周年和周数
 * ISO 8601：周以周一为起点，第 1 周是包含当年第一个周四的周
 * 跨年时（1 月初/12 月末），ISO year 可能与日历年不同
 * @param date - 待计算的日期
 * @returns { year: ISO 年, weekNumber: ISO 周数 }
 */
function getISOWeekYearAndWeek(date: Date): { year: number; weekNumber: number } {
  // 复制日期并按 UTC 处理，避免本地时区干扰
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // getUTCDay(): 0=周日, 1=周一...6=周六；ISO 以周一为周首，将周日(0)转为 7
  const dayNum = d.getUTCDay() || 7;
  // 调整到当前 ISO 周的周四（周四是该周的标准锚点）
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), weekNumber };
}

/**
 * 构建 mock 周报数据（骨架阶段不实现真实统计）
 * 结构对齐 TECH_DESIGN 6.12.5 的 health/activities/family 三段式
 */
function buildMockReportData(): Record<string, unknown> {
  return {
    health: {
      checkin_count: 0,
      avg_poop: 0,
      avg_appetite: 0,
      avg_spirit: 0,
      anomaly_count: 0,
      best_day: null,
    },
    activities: {
      symptom_checks: 0,
      food_queries: 0,
      new_moments: 0,
      new_milestones: 0,
    },
    family: {
      feed_count: 0,
      new_events: 0,
      active_pets: 0,
    },
  };
}

/**
 * 分页查询家庭周报列表
 * - 校验家庭归属
 * - 查询列表 + 总数（并行）
 */
export async function listReports(
  userId: string,
  familyId: string,
  query: WeeklyReportQueryInput,
): Promise<WeeklyReportListResponse> {
  const owns = await verifyFamilyOwnership(familyId, userId);
  if (!owns) {
    throw new WeeklyReportError(403, '无权查看此家庭');
  }

  const [items, total] = await Promise.all([
    weeklyReportRepository.findByFamilyId(
      familyId,
      query.page,
      query.page_size,
      query.year,
    ),
    weeklyReportRepository.countByFamilyId(familyId, query.year),
  ]);

  return {
    items,
    total,
    page: query.page,
    page_size: query.page_size,
  };
}

/**
 * 获取家庭最新周报
 * - 校验家庭归属
 * - 无周报返回 404
 */
export async function getLatest(
  userId: string,
  familyId: string,
): Promise<WeeklyReportRow> {
  const owns = await verifyFamilyOwnership(familyId, userId);
  if (!owns) {
    throw new WeeklyReportError(403, '无权查看此家庭');
  }

  const latest = await weeklyReportRepository.findLatestByFamilyId(familyId);
  if (!latest) {
    throw new WeeklyReportError(404, '暂无周报');
  }
  return latest;
}

/**
 * 获取周报详情
 * - 校验家庭归属
 * - 周报不存在或不属于该家庭返回 404
 */
export async function getReport(
  userId: string,
  familyId: string,
  reportId: string,
): Promise<WeeklyReportRow> {
  const owns = await verifyFamilyOwnership(familyId, userId);
  if (!owns) {
    throw new WeeklyReportError(403, '无权查看此家庭');
  }

  const report = await weeklyReportRepository.findByIdAndFamily(reportId, familyId);
  if (!report) {
    throw new WeeklyReportError(404, '周报不存在');
  }
  return report;
}

/**
 * 手动生成周报
 * - 校验家庭归属
 * - 计算当前 ISO 周年与周数
 * - 检查同周是否已生成（UNIQUE 预检），有则 409
 * - 插入 mock 数据，ai_insight 和 share_card_url 为 null
 */
export async function generateReport(
  userId: string,
  familyId: string,
): Promise<WeeklyReportRow> {
  const owns = await verifyFamilyOwnership(familyId, userId);
  if (!owns) {
    throw new WeeklyReportError(403, '无权操作此家庭');
  }

  const { year, weekNumber } = getISOWeekYearAndWeek(new Date());

  const existing = await weeklyReportRepository.findExisting(familyId, year, weekNumber);
  if (existing) {
    throw new WeeklyReportError(409, '本周周报已生成');
  }

  return weeklyReportRepository.insertReport({
    family_id: familyId,
    year,
    week_number: weekNumber,
    report_data: buildMockReportData(),
    ai_insight: null,
    share_card_url: null,
  });
}
