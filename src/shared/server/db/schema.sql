-- 星寰海 Supabase 数据库 Schema
-- 版本: v1.0
-- 日期: 2026-06-17
-- 说明: 阶段3后端基础设施 - 数据库设计与迁移

-- ============================================================
-- 1. 用户表
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('wechat', 'alipay', 'apple', 'dev')),
  provider_user_id VARCHAR(128) NOT NULL,
  phone_number VARCHAR(20),
  display_name VARCHAR(64) NOT NULL,
  avatar_url TEXT,
  age SMALLINT CHECK (age > 0 AND age <= 150),
  role VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number) WHERE phone_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================
-- 2. 设备绑定表
-- ============================================================
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_name VARCHAR(128) NOT NULL,
  platform VARCHAR(32) NOT NULL DEFAULT 'web',
  last_login_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  bound_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_devices_user ON devices(user_id);

-- ============================================================
-- 3. 订单表
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id VARCHAR(64) NOT NULL,
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('wechat', 'alipay', 'apple')),
  amount INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded', 'cancelled')),
  channel_trade_no VARCHAR(128),
  receipt TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- ============================================================
-- 4. 支付记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  channel VARCHAR(20) NOT NULL,
  trade_no VARCHAR(128),
  amount INTEGER NOT NULL,
  raw_callback JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_records_order ON payment_records(order_id);

-- ============================================================
-- 5. 权益表
-- ============================================================
CREATE TABLE IF NOT EXISTS entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entitlement_key VARCHAR(128) NOT NULL,
  source_order_id VARCHAR(64) REFERENCES orders(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, entitlement_key)
);

CREATE INDEX IF NOT EXISTS idx_entitlements_user ON entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_key ON entitlements(entitlement_key);

-- ============================================================
-- 6. Persona 角色表
-- ============================================================
CREATE TABLE IF NOT EXISTS personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(64) NOT NULL,
  description TEXT,
  persona_type VARCHAR(32) NOT NULL DEFAULT 'custom' CHECK (persona_type IN ('system', 'custom', 'community', 'cameo')),
  config JSONB NOT NULL DEFAULT '{}',
  avatar_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  share_count INTEGER NOT NULL DEFAULT 0,
  rating_avg REAL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'reviewing', 'rejected', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_personas_user ON personas(user_id);
CREATE INDEX IF NOT EXISTS idx_personas_type ON personas(persona_type);
CREATE INDEX IF NOT EXISTS idx_personas_public ON personas(is_public) WHERE is_public = true;

-- ============================================================
-- 7. 记忆事件表
-- ============================================================
CREATE TABLE IF NOT EXISTS memory_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(32) NOT NULL,
  content TEXT,
  metadata JSONB DEFAULT '{}',
  importance SMALLINT DEFAULT 0 CHECK (importance >= 0 AND importance <= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memory_events_user ON memory_events(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_events_type ON memory_events(event_type);
CREATE INDEX IF NOT EXISTS idx_memory_events_created ON memory_events(created_at DESC);

-- ============================================================
-- 8. 同步日志表
-- ============================================================
CREATE TABLE IF NOT EXISTS sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  table_name VARCHAR(64) NOT NULL,
  record_id VARCHAR(128) NOT NULL,
  action VARCHAR(10) NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sync_log_user ON sync_log(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_table ON sync_log(table_name);

-- ============================================================
-- 9. 启用 Row Level Security (RLS)
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 10. RLS 策略：用户只能访问自己的数据
-- ============================================================

-- users 表：用户只能读写自己的记录
CREATE POLICY users_self_policy ON users
  FOR ALL USING (auth.uid() = id);

-- devices 表
CREATE POLICY devices_self_policy ON devices
  FOR ALL USING (auth.uid() = user_id);

-- orders 表
CREATE POLICY orders_self_policy ON orders
  FOR ALL USING (auth.uid() = user_id);

-- payment_records 表
CREATE POLICY payment_records_self_policy ON payment_records
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM orders WHERE orders.id = payment_records.order_id)
  );

-- entitlements 表
CREATE POLICY entitlements_self_policy ON entitlements
  FOR ALL USING (auth.uid() = user_id);

-- personas 表：公开角色所有人可读
CREATE POLICY personas_self_policy ON personas
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY personas_public_read_policy ON personas
  FOR SELECT USING (is_public = true AND status = 'active');

-- memory_events 表
CREATE POLICY memory_events_self_policy ON memory_events
  FOR ALL USING (auth.uid() = user_id);

-- sync_log 表
CREATE POLICY sync_log_self_policy ON sync_log
  FOR ALL USING (auth.uid() = user_id);
