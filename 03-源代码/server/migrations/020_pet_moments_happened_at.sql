-- 回忆补记：pet_moments 增加"发生日期"列
-- 背景：用户反馈回忆无法选择时间补记。原来只有 created_at（保存时刻），
-- 现在增加 happened_at（回忆发生的日期），保存时可手动选择过去任意一天。
-- 幂等设计：migrate.ts 每次启动都会重跑全部 SQL，因此必须 IF NOT EXISTS / 空值回填。
-- 回填策略：老数据 happened_at 为空时，用 created_at 兜底，保证旧回忆排序不紊乱。
ALTER TABLE pet_moments ADD COLUMN IF NOT EXISTS happened_at TIMESTAMPTZ;
UPDATE pet_moments SET happened_at = created_at WHERE happened_at IS NULL;
ALTER TABLE pet_moments ALTER COLUMN happened_at SET DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_pet_moments_pet_happened ON pet_moments(pet_id, happened_at DESC);
CREATE INDEX IF NOT EXISTS idx_pet_moments_user_happened ON pet_moments(user_id, happened_at DESC);
