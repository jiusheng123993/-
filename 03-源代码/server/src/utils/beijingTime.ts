/**
 * 北京时区日期工具（审查⏳1 专项：全链路 UTC 时区归组校准）
 *
 * 背景：生产 PostgreSQL 服务器默认 UTC、Node 默认 UTC——此前散落的
 * `new Date().toISOString().slice(0, 10)` 与 SQL `created_at::date` 都按 UTC 取"今天"，
 * 导致北京时间 0-8 点的打卡/喂养/查询被归到前一天（每日摘要、今日去重、趋势归组全错日）。
 *
 * 口径统一（与 memoryService.ts 既有先例一致）：
 * - JS 侧"今日"一律用本 helper（北京墙钟日期）
 * - SQL 侧归组一律用 `(created_at AT TIME ZONE 'Asia/Shanghai')::date`
 * - SQL 侧北京日期 → 时间区间用 `($n::date AT TIME ZONE 'Asia/Shanghai')`
 */

/** 北京时区偏移毫秒数（UTC+8，无夏令时） */
const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;

/**
 * 获取北京时区"今日"日期字符串（YYYY-MM-DD）
 * 实现：北京时间无夏令时，UTC 时间 +8h 后取 ISO 日期分量即为北京墙钟日期
 */
export function beijingDateString(now: Date = new Date()): string {
  return new Date(now.getTime() + BEIJING_OFFSET_MS).toISOString().slice(0, 10);
}
