-- 星寰海 Supabase 数据库 Schema
-- 版本: v2.0
-- 日期: 2026-07-18
-- 说明: AI宠物管家 MVP - 数据库设计与迁移

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

-- ============================================================
-- 9. 宠物档案表
-- ============================================================
CREATE TABLE IF NOT EXISTS pet_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(64) NOT NULL,
  species VARCHAR(20) NOT NULL CHECK (species IN ('dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other')),
  breed VARCHAR(64),
  gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'unknown')),
  birth_date DATE,
  adoption_date DATE,
  weight DECIMAL(6,2) CHECK (weight > 0),
  avatar_url TEXT,
  is_neutered BOOLEAN DEFAULT false,
  is_deceased BOOLEAN DEFAULT false,
  deceased_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pet_profiles_user ON pet_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_pet_profiles_species ON pet_profiles(species);

-- ============================================================
-- 10. 健康打卡表
-- ============================================================
CREATE TABLE IF NOT EXISTS pet_health_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  appetite VARCHAR(20) NOT NULL CHECK (appetite IN ('great', 'good', 'poor', 'none')),
  energy VARCHAR(20) NOT NULL CHECK (energy IN ('high', 'normal', 'low', 'lethargic')),
  stool VARCHAR(20) NOT NULL CHECK (stool IN ('normal', 'soft', 'hard', 'diarrhea', 'bloody')),
  mood VARCHAR(20) NOT NULL CHECK (mood IN ('happy', 'calm', 'anxious', 'aggressive', 'depressed')),
  weight DECIMAL(6,2) CHECK (weight > 0),
  symptoms TEXT[],
  notes TEXT,
  ai_feedback JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(pet_id, entry_date)
);

CREATE INDEX IF NOT EXISTS idx_health_entries_pet ON pet_health_entries(pet_id);
CREATE INDEX IF NOT EXISTS idx_health_entries_user ON pet_health_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_health_entries_date ON pet_health_entries(entry_date DESC);

-- ============================================================
-- 11. 食物安全查询记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS pet_food_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES pet_profiles(id) ON DELETE SET NULL,
  food_name VARCHAR(128) NOT NULL,
  species VARCHAR(20) NOT NULL,
  safety_level VARCHAR(20) NOT NULL CHECK (safety_level IN ('safe', 'caution', 'dangerous', 'toxic')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_food_queries_user ON pet_food_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_food_queries_food ON pet_food_queries(food_name);

-- ============================================================
-- 12. 症状初筛记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS pet_symptom_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symptoms TEXT[] NOT NULL,
  duration VARCHAR(20) NOT NULL CHECK (duration IN ('hours', '1day', '2-3days', 'week', 'longer')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe', 'emergency')),
  urgency_level VARCHAR(20) NOT NULL CHECK (urgency_level IN ('green', 'yellow', 'orange', 'red')),
  possible_conditions JSONB DEFAULT '[]',
  ai_advice TEXT,
  disclaimer_accepted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_symptom_checks_pet ON pet_symptom_checks(pet_id);
CREATE INDEX IF NOT EXISTS idx_symptom_checks_user ON pet_symptom_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_symptom_checks_urgency ON pet_symptom_checks(urgency_level);

-- ============================================================
-- 13. 疫苗驱虫记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS pet_vaccinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vaccine_name VARCHAR(128) NOT NULL,
  vaccine_type VARCHAR(20) NOT NULL CHECK (vaccine_type IN ('core', 'non_core', 'deworming', 'flea_tick')),
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  is_overdue BOOLEAN GENERATED ALWAYS AS (completed_date IS NULL AND scheduled_date < CURRENT_DATE) STORED,
  provider VARCHAR(64),
  batch_number VARCHAR(64),
  notes TEXT,
  next_due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vaccinations_pet ON pet_vaccinations(pet_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_user ON pet_vaccinations(user_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_scheduled ON pet_vaccinations(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_vaccinations_overdue ON pet_vaccinations(is_overdue) WHERE completed_date IS NULL;

-- ============================================================
-- 14. 健康趋势数据表
-- ============================================================
CREATE TABLE IF NOT EXISTS pet_health_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type VARCHAR(10) NOT NULL CHECK (period_type IN ('week', 'month', 'quarter')),
  weight_trend JSONB,
  appetite_trend JSONB,
  stool_trend JSONB,
  mood_trend JSONB,
  anomaly_flags JSONB DEFAULT '[]',
  monthly_summary JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(pet_id, period_start, period_type)
);

CREATE INDEX IF NOT EXISTS idx_health_trends_pet ON pet_health_trends(pet_id);
CREATE INDEX IF NOT EXISTS idx_health_trends_period ON pet_health_trends(period_start DESC);

-- ============================================================
-- 15. 会员订阅表
-- ============================================================
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan VARCHAR(20) NOT NULL CHECK (plan IN ('free', 'basic', 'pro')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN NOT NULL DEFAULT false,
  source_order_id VARCHAR(64) REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);
CREATE INDEX IF NOT EXISTS idx_memberships_expires ON memberships(expires_at);

-- ============================================================
-- 16. 配额使用记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS usage_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quota_type VARCHAR(32) NOT NULL CHECK (quota_type IN ('symptom_check', 'food_query', 'ai_chat', 'avatar_generate', 'trend_report')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  used_count INTEGER NOT NULL DEFAULT 0,
  max_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, quota_type, period_start)
);

CREATE INDEX IF NOT EXISTS idx_usage_quotas_user ON usage_quotas(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_quotas_type ON usage_quotas(quota_type);

-- ============================================================
-- 17. 情绪触发记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS emotion_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES pet_profiles(id) ON DELETE SET NULL,
  trigger_type VARCHAR(32) NOT NULL CHECK (trigger_type IN ('pet_illness', 'pet_deceased', 'anniversary', 'vaccine_reminder', 'checkin_anomaly', 'milestone')),
  emotion VARCHAR(20) NOT NULL CHECK (emotion IN ('grief', 'anxiety', 'joy', 'nostalgia', 'worry', 'relief')),
  intensity VARCHAR(10) NOT NULL CHECK (intensity IN ('low', 'medium', 'high')),
  context JSONB DEFAULT '{}',
  ai_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emotion_triggers_user ON emotion_triggers(user_id);
CREATE INDEX IF NOT EXISTS idx_emotion_triggers_type ON emotion_triggers(trigger_type);

-- ============================================================
-- 18. 宠物悲伤陪伴会话表
-- ============================================================
CREATE TABLE IF NOT EXISTS pet_grief_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES pet_profiles(id) ON DELETE SET NULL,
  stage VARCHAR(20) NOT NULL CHECK (stage IN ('denial', 'anger', 'bargaining', 'depression', 'acceptance')),
  messages JSONB NOT NULL DEFAULT '[]',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_grief_sessions_user ON pet_grief_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_grief_sessions_active ON pet_grief_sessions(is_active) WHERE is_active = true;

-- ============================================================
-- 19. 启用新增表的 Row Level Security (RLS)
-- ============================================================
ALTER TABLE pet_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_health_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_food_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_symptom_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_health_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotion_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_grief_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 20. 新增表 RLS 策略
-- ============================================================

CREATE POLICY pet_profiles_self_policy ON pet_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY health_entries_self_policy ON pet_health_entries
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY food_queries_self_policy ON pet_food_queries
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY symptom_checks_self_policy ON pet_symptom_checks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY vaccinations_self_policy ON pet_vaccinations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY health_trends_self_policy ON pet_health_trends
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY memberships_self_policy ON memberships
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY usage_quotas_self_policy ON usage_quotas
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY emotion_triggers_self_policy ON emotion_triggers
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY grief_sessions_self_policy ON pet_grief_sessions
  FOR ALL USING (auth.uid() = user_id);
