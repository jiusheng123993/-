-- 035_memoir_standard_plan.sql
-- 回忆录三档定价体系（2026-09-09）：订单 plan 枚举新增 memoir_standard
--
-- 背景：三档体系下 standard（标准回忆录，会员 45 元/非会员 59 元）独立成单，
-- 订单 plan 映射 memoirTierToOrderPlan：light→memoir_daily、standard→memoir_standard、
-- full→memoir_memorial。迁移 009 的 CHECK 约束只允许 memoir_daily/memoir_memorial，
-- 缺 memoir_standard → standard 档下单 INSERT 必然 check violation（500）。
--
-- 幂等：先 DROP IF EXISTS 再重建 CHECK，可重复执行。
-- 部署：遇 "must be owner of table" 用 sudo -u postgres psql 执行，并
--       ALTER TABLE payment_orders OWNER TO <应用用户>（见部署配置规范）。

ALTER TABLE payment_orders
  DROP CONSTRAINT IF EXISTS payment_orders_plan_check;

ALTER TABLE payment_orders
  ADD CONSTRAINT payment_orders_plan_check
  CHECK (plan IN ('monthly', 'quarterly', 'yearly', 'memoir_daily', 'memoir_standard', 'memoir_memorial'));

COMMENT ON CONSTRAINT payment_orders_plan_check ON payment_orders IS
  '订单类型：会员订阅（monthly/quarterly/yearly）+ 回忆录三档（memoir_daily 轻纪念 / memoir_standard 标准回忆录 / memoir_memorial 完整回忆录，2026-09-09 三档定价体系）';
