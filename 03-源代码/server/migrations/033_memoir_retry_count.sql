-- 033_memoir_retry_count.sql
-- 回忆录重试计数持久化（审查⏳4：进程重启清零可多烧 2 轮 Seedance 视频）
--
-- 背景：memoirProcessor 的审核拒绝重试计数原存内存 Map（retryCountMap），
-- PM2 重启/进程崩溃后清零 → 同一坏任务可再烧最多 2 轮视频生成（单条 20-200 元）。
-- 改为落库持久化：retry_count 列，原子 UPDATE ... RETURNING 递增。
--
-- 幂等：ADD COLUMN IF NOT EXISTS，可重复执行。

ALTER TABLE pet_memoir_records
  ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;

-- 历史行重置（防御性：理论上无此列即无历史脏值，IF NOT EXISTS 下新列默认 0 已覆盖）
COMMENT ON COLUMN pet_memoir_records.retry_count IS '内容审核拒绝后的自动重试计数（持久化，防进程重启清零多烧视频成本）';
