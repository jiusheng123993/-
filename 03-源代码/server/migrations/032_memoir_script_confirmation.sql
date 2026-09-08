-- 032: 回忆录剧本确认闸门（立项 v0.2 P0-2，需求追踪 #12）
-- 目的：回忆录任务先由 AI 生成分镜脚本并暂停，用户确认后再进入视频生成阶段（Seedance 烧钱步骤），
--       避免用户未确认剧本就产生 20-200 元/条的视频成本浪费。
-- 设计：零 status 值域变更（pet_memoir_records 为迁移体系外的历史建表，status 无 CHECK 也无法确证生产约束），
--       用 awaiting_confirmation 布尔旗标表达"剧本已生成、等待用户确认"的暂停态：
--       pending + awaiting_confirmation=true  → 处理器跳过，等用户确认
--       pending + awaiting_confirmation=false → 正常入队（新任务 / 用户确认后）
-- 幂等：ADD COLUMN IF NOT EXISTS，可重复执行。

ALTER TABLE pet_memoir_records
  ADD COLUMN IF NOT EXISTS awaiting_confirmation BOOLEAN NOT NULL DEFAULT false;

-- 用户确认剧本的时间（审计与产品漏斗分析用；拒绝时间走 script_rejected_at）
ALTER TABLE pet_memoir_records
  ADD COLUMN IF NOT EXISTS script_confirmed_at TIMESTAMPTZ;

ALTER TABLE pet_memoir_records
  ADD COLUMN IF NOT EXISTS script_rejected_at TIMESTAMPTZ;

-- 索引：处理器轮询按 pending + 非暂停扫描，复合索引避免全表过滤
CREATE INDEX IF NOT EXISTS idx_pet_memoir_records_pending_unconfirmed
  ON pet_memoir_records (created_at)
  WHERE status = 'pending' AND awaiting_confirmation = false;
