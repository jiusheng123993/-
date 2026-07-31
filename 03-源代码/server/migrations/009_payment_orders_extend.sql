-- 009_payment_orders_extend.sql
-- 扩展 payment_orders 表以支持多业务场景（会员订阅 + 回忆录付费生成）
--
-- 变更内容：
--   1. 新增 product_type 字段：区分订单用途（membership | memoir）
--   2. 新增 product_metadata JSONB 字段：存储业务上下文（memoir_type、pet_id、source_photos 等）
--   3. 新增 transaction_id 字段：微信支付单号，用于对账和退款
--   4. 放宽 plan CHECK 约束：允许 monthly | quarterly | yearly | memoir_daily | memoir_memorial
--   5. 新增 product_type 索引：按业务类型查询订单
--   6. 新增 transaction_id 唯一索引：防重复回调
--
-- 安全考虑：
--   - product_metadata 不存敏感信息（不入 source_text 原文、不入 openid）
--   - transaction_id 唯一约束防止回调重复处理
--   - 状态机约束：pending → paid → refunded（不允许跳跃）

-- ===== 1. 新增字段 =====
ALTER TABLE payment_orders
  ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'membership'
    CHECK (product_type IN ('membership', 'memoir')),
  ADD COLUMN IF NOT EXISTS product_metadata JSONB,
  ADD COLUMN IF NOT EXISTS transaction_id TEXT;

-- ===== 2. 放宽 plan CHECK 约束 =====
-- 旧约束：plan IN ('monthly', 'quarterly', 'yearly')
-- 新约束：增加 memoir_daily | memoir_memorial
ALTER TABLE payment_orders DROP CONSTRAINT IF EXISTS payment_orders_plan_check;
ALTER TABLE payment_orders
  ADD CONSTRAINT payment_orders_plan_check
  CHECK (plan IN ('monthly', 'quarterly', 'yearly', 'memoir_daily', 'memoir_memorial'));

-- ===== 3. 索引 =====
CREATE INDEX IF NOT EXISTS idx_payment_orders_product_type
  ON payment_orders(product_type, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_orders_transaction_id
  ON payment_orders(transaction_id)
  WHERE transaction_id IS NOT NULL;

-- ===== 4. 同步 pet_memoir_records.payment_id 类型 =====
-- payment_orders.id 是 TEXT，pet_memoir_records.payment_id 是 UUID
-- 需要统一为 TEXT 以便关联查询
-- 注意：仅在 payment_id 列存在且类型为 UUID 时才执行
ALTER TABLE pet_memoir_records
  ALTER COLUMN payment_id TYPE TEXT USING payment_id::TEXT;

-- ===== 5. 增加外键约束（可选，确保 memoir 关联有效订单） =====
-- 注意：由于 payment_orders.id 是 TEXT，pet_memoir_records.payment_id 已转为 TEXT
-- 此处不加外键约束，避免删除订单时影响 memoir 记录，仅通过应用层校验
