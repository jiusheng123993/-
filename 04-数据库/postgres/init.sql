-- ============================================================
-- 星寰海 PostgreSQL 数据库初始化脚本 (宠物管家 MVP)
-- 版本: v2.1 (标准 PostgreSQL 适配版)
-- 更新: 2026-07-24
-- 说明: 去除 Supabase 特有语法（RLS/Storage/auth.*），适配腾讯云 PostgreSQL
-- 在腾讯云 PostgreSQL 数据库上执行此脚本
-- ============================================================

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. users（用户主表）
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  openid        TEXT NOT NULL UNIQUE,
  unionid       TEXT,
  nickname      TEXT,
  avatar_url    TEXT,
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  last_active   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_openid ON users(openid);

-- ============================================================
-- 2. memberships（会员订阅）
-- ============================================================
CREATE TABLE IF NOT EXISTS memberships (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier              TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'member')),
  plan              TEXT CHECK (plan IN ('monthly', 'quarterly', 'yearly')),
  status            TEXT NOT NULL DEFAULT 'none' CHECK (status IN ('active', 'expired', 'cancelled', 'none')),
  price             INTEGER,
  payment_order_id  TEXT,
  expires_at        TIMESTAMPTZ,
  started_at        TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(user_id, status);

-- ============================================================
-- 3. pet_profiles（宠物档案）
-- ============================================================
CREATE TABLE IF NOT EXISTS pet_profiles (
  id                    TEXT PRIMARY KEY,
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  species               TEXT NOT NULL CHECK (species IN ('dog', 'cat')),
  breed                 TEXT NOT NULL,
  breed_id              TEXT NOT NULL,
  gender                TEXT NOT NULL CHECK (gender IN ('male', 'female', 'unknown')),
  birth_date            TEXT NOT NULL,
  weight                NUMERIC(6,2) NOT NULL DEFAULT 0,
  avatar_photo_url      TEXT,
  avatar_cartoon_url    TEXT,
  avatar_style          TEXT,
  avatar_generated_at   TIMESTAMPTZ,
  photos                TEXT[] DEFAULT '{}',
  is_neutered           BOOLEAN NOT NULL DEFAULT false,
  microchip_id          TEXT DEFAULT '',
  notes                 TEXT DEFAULT '',
  is_deceased           BOOLEAN NOT NULL DEFAULT false,
  deceased_date         TEXT,
  litter_date           DATE,
  birth_season          TEXT,
  outfit_summary        JSONB,
  theme_suite_url       TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pet_profiles_user ON pet_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_pet_profiles_species ON pet_profiles(user_id, species);

-- ============================================================
-- 4. pet_health_entries（健康打卡）
-- ============================================================
CREATE TABLE IF NOT EXISTS pet_health_entries (
  id              TEXT PRIMARY KEY,
  pet_id          TEXT NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  poop_level      SMALLINT NOT NULL CHECK (poop_level >= 1 AND poop_level <= 5),
  appetite_level  SMALLINT NOT NULL CHECK (appetite_level >= 1 AND appetite_level <= 5),
  spirit_level    SMALLINT NOT NULL CHECK (spirit_level >= 1 AND spirit_level <= 5),
  exercise_level  SMALLINT NOT NULL CHECK (exercise_level >= 1 AND exercise_level <= 3),
  weight          NUMERIC(6,2),
  has_anomaly     BOOLEAN NOT NULL DEFAULT false,
  anomaly_items   TEXT[] DEFAULT '{}',
  ai_feedback     TEXT,
  risk_level      TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'emergency')),
  note            TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_health_entries_pet ON pet_health_entries(pet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_entries_user ON pet_health_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_entries_anomaly ON pet_health_entries(user_id, has_anomaly) WHERE has_anomaly = true;

-- ============================================================
-- 5. pet_vaccinations（疫苗驱虫记录）
-- ============================================================
CREATE TABLE IF NOT EXISTS pet_vaccinations (
  id                TEXT PRIMARY KEY,
  pet_id            TEXT NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type              TEXT NOT NULL CHECK (type IN ('vaccine', 'deworm')),
  category          TEXT NOT NULL,
  date              TEXT NOT NULL,
  next_date         TEXT NOT NULL,
  status            TEXT NOT NULL CHECK (status IN ('completed', 'pending', 'overdue')),
  hospital          TEXT,
  doctor            TEXT,
  notes             TEXT,
  reminder_enabled  BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vaccinations_pet ON pet_vaccinations(pet_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_user ON pet_vaccinations(user_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_status ON pet_vaccinations(user_id, status) WHERE status IN ('pending', 'overdue');

-- ============================================================
-- 6. pet_symptom_checks（症状初筛）
-- ============================================================
CREATE TABLE IF NOT EXISTS pet_symptom_checks (
  id                TEXT PRIMARY KEY,
  pet_id            TEXT NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symptoms          TEXT[] NOT NULL,
  duration          TEXT,
  severity          TEXT,
  additional_info   JSONB DEFAULT '{}',
  risk_level        TEXT NOT NULL CHECK (risk_level IN ('normal', 'caution', 'warning', 'emergency')),
  possible_conditions TEXT[] DEFAULT '{}',
  ai_advice         TEXT,
  recommended_actions TEXT[] DEFAULT '{}',
  knowledge_match   JSONB,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_symptom_checks_pet ON pet_symptom_checks(pet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_symptom_checks_user ON pet_symptom_checks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_symptom_checks_risk ON pet_symptom_checks(user_id, risk_level) WHERE risk_level IN ('warning', 'emergency');

-- ============================================================
-- 7. pet_food_queries（食物安全查询）
-- ============================================================
CREATE TABLE IF NOT EXISTS pet_food_queries (
  id                  TEXT PRIMARY KEY,
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  food_name           TEXT NOT NULL,
  safety_level        TEXT NOT NULL CHECK (safety_level IN ('safe', 'caution', 'dangerous', 'toxic')),
  detail              TEXT,
  dangerous_compounds TEXT[] DEFAULT '{}',
  toxic_doses         TEXT,
  symptoms            TEXT[] DEFAULT '{}',
  breed_warnings      TEXT[] DEFAULT '{}',
  first_aid           TEXT,
  is_member_query     BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_food_queries_user ON pet_food_queries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_food_queries_food ON pet_food_queries(food_name);

-- ============================================================
-- 8. emotion_triggers（情绪触发记录）
-- ============================================================
CREATE TABLE IF NOT EXISTS emotion_triggers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id        TEXT REFERENCES pet_profiles(id) ON DELETE SET NULL,
  scene         TEXT NOT NULL,
  trigger_type  TEXT NOT NULL,
  user_action   TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emotion_triggers_user ON emotion_triggers(user_id, created_at DESC);

-- ============================================================
-- 9. pet_grief_sessions（宠物离世悲伤陪伴）
-- ============================================================
CREATE TABLE IF NOT EXISTS pet_grief_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id        TEXT REFERENCES pet_profiles(id) ON DELETE SET NULL,
  step_naming   JSONB DEFAULT '{}',
  step_writing  JSONB DEFAULT '{}',
  step_connect  JSONB DEFAULT '{}',
  step_closing  JSONB DEFAULT '{}',
  mood_before   SMALLINT CHECK (mood_before >= 1 AND mood_before <= 5),
  mood_after    SMALLINT CHECK (mood_after >= 1 AND mood_after <= 5),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_grief_sessions_user ON pet_grief_sessions(user_id, created_at DESC);

-- ============================================================
-- 10. usage_quotas（使用配额）
-- ============================================================
CREATE TABLE IF NOT EXISTS usage_quotas (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date                  DATE NOT NULL DEFAULT CURRENT_DATE,
  food_queries_count    SMALLINT NOT NULL DEFAULT 0,
  symptom_checks_count  SMALLINT NOT NULL DEFAULT 0,
  trend_days_viewed     SMALLINT NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_usage_quotas_user_date ON usage_quotas(user_id, date DESC);

-- ============================================================
-- 11. behavior_logs（行为日志）
-- ============================================================
CREATE TABLE IF NOT EXISTS behavior_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  page        TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_behavior_logs_user ON behavior_logs(user_id, created_at DESC);

-- ============================================================
-- 12. sync_queue（同步队列）
-- ============================================================
CREATE TABLE IF NOT EXISTS sync_queue (
  id          TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  table_name  TEXT NOT NULL,
  record_id   TEXT NOT NULL,
  action      TEXT NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
  data        TEXT NOT NULL,
  synced      BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_user ON sync_queue(user_id, synced) WHERE synced = false;
CREATE INDEX IF NOT EXISTS idx_sync_queue_table ON sync_queue(user_id, table_name);

-- ============================================================
-- 13. pet_knowledge_base（知识库版本）
-- ============================================================
CREATE TABLE IF NOT EXISTS pet_knowledge_base (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT NOT NULL,
  version     TEXT NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now(),
  source      TEXT
);

-- ============================================================
-- 14. hospital_referrals（医院导流）
-- ============================================================
CREATE TABLE IF NOT EXISTS hospital_referrals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id          TEXT REFERENCES pet_profiles(id) ON DELETE SET NULL,
  urgency_level   TEXT NOT NULL,
  source          TEXT NOT NULL,
  clicked_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hospital_referrals_user ON hospital_referrals(user_id);

-- ============================================================
-- 15. payment_orders（支付订单）
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_orders (
  id                TEXT PRIMARY KEY,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan              TEXT NOT NULL CHECK (plan IN ('monthly', 'quarterly', 'yearly', 'memoir_daily', 'memoir_memorial')),
  amount            INTEGER NOT NULL CHECK (amount > 0),
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded', 'paid')),
  channel           TEXT NOT NULL DEFAULT 'wechat',
  product_type      TEXT NOT NULL DEFAULT 'membership' CHECK (product_type IN ('membership', 'memoir')),
  product_metadata  JSONB,
  transaction_id    TEXT,
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON payment_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(user_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_payment_orders_product_type ON payment_orders(product_type, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_orders_transaction_id ON payment_orders(transaction_id) WHERE transaction_id IS NOT NULL;

-- ============================================================
-- 16. avatar_generations（AI头像生成记录）
-- ============================================================
CREATE TABLE IF NOT EXISTS avatar_generations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id          TEXT NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  prompt          TEXT NOT NULL,
  style           TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  result_url      TEXT,
  error           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_avatar_generations_user ON avatar_generations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_avatar_generations_pet ON avatar_generations(pet_id);

-- ============================================================
-- 17. invite_codes（邀请码）
-- ============================================================
CREATE TABLE IF NOT EXISTS invite_codes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL UNIQUE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  use_count       SMALLINT NOT NULL DEFAULT 0,
  max_use_count   SMALLINT NOT NULL DEFAULT 50,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invite_codes_user ON invite_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);

-- ============================================================
-- 18. share_records（分享记录）
-- ============================================================
CREATE TABLE IF NOT EXISTS share_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_type       TEXT NOT NULL CHECK (card_type IN ('food', 'health_trend', 'vaccine', 'achievement')),
  pet_id          TEXT REFERENCES pet_profiles(id) ON DELETE SET NULL,
  platform        TEXT NOT NULL DEFAULT 'wechat',
  invite_code     TEXT REFERENCES invite_codes(code) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_share_records_user ON share_records(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_share_records_type ON share_records(user_id, card_type);

-- ============================================================
-- 19. referral_records（推荐记录）
-- ============================================================
CREATE TABLE IF NOT EXISTS referral_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitee_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invite_code     TEXT NOT NULL REFERENCES invite_codes(code),
  reward_granted  BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(inviter_id, invitee_id)
);

CREATE INDEX IF NOT EXISTS idx_referral_records_inviter ON referral_records(inviter_id);
CREATE INDEX IF NOT EXISTS idx_referral_records_invitee ON referral_records(invitee_id);

-- ============================================================
-- 20. avatar_generation_tasks（形象生成任务表）
-- ============================================================
CREATE TABLE IF NOT EXISTS avatar_generation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  pet_id UUID NOT NULL,
  task_type VARCHAR(10) NOT NULL CHECK (task_type IN ('2d', '3d', 'theme_suite')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  reference_photo_url TEXT,
  result_data JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_avatar_tasks_user_id ON avatar_generation_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_avatar_tasks_pet_id ON avatar_generation_tasks(pet_id);
CREATE INDEX IF NOT EXISTS idx_avatar_tasks_status ON avatar_generation_tasks(status);

-- ============================================================
-- 21. avatar_2d_images（2D 形象图片表）
-- ============================================================
CREATE TABLE IF NOT EXISTS avatar_2d_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES avatar_generation_tasks(id) ON DELETE CASCADE,
  angle VARCHAR(10) NOT NULL,
  expression VARCHAR(20) NOT NULL,
  image_url TEXT NOT NULL,
  is_selected BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_avatar_2d_task_id ON avatar_2d_images(task_id);

-- ============================================================
-- 22. avatar_3d_models（3D 模型表）
-- ============================================================
CREATE TABLE IF NOT EXISTS avatar_3d_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES avatar_generation_tasks(id) ON DELETE CASCADE,
  model_url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_avatar_3d_task_id ON avatar_3d_models(task_id);

-- ============================================================
-- 23. accessories（全局饰品配置表）
-- ============================================================
CREATE TABLE IF NOT EXISTS accessories (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  slot            TEXT NOT NULL CHECK (slot IN ('head','neck','back','body','feet')),
  svg_path        TEXT NOT NULL,
  species_compat  TEXT[] DEFAULT '{}',
  unlock_source   TEXT NOT NULL CHECK (unlock_source IN ('default','achievement','paid','member')),
  unlock_condition JSONB DEFAULT '{}',
  sort_order      INT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 24. user_accessory_inventory（用户饰品库存表）
-- ============================================================
CREATE TABLE IF NOT EXISTS user_accessory_inventory (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  accessory_id    TEXT NOT NULL REFERENCES accessories(id),
  unlocked_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  unlock_source   TEXT NOT NULL,
  UNIQUE(user_id, accessory_id)
);

CREATE INDEX IF NOT EXISTS idx_user_accessory_user ON user_accessory_inventory(user_id);

-- ============================================================
-- 25. pet_outfits（宠物装备表）
-- ============================================================
CREATE TABLE IF NOT EXISTS pet_outfits (
  pet_id          TEXT PRIMARY KEY REFERENCES pet_profiles(id) ON DELETE CASCADE,
  outfit_slots    JSONB NOT NULL DEFAULT '{}',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 26. theme_suites（全局主题套装配置表）
-- ============================================================
CREATE TABLE IF NOT EXISTS theme_suites (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  category        TEXT NOT NULL CHECK (category IN ('festival','season','birthday','special')),
  prompt_template TEXT NOT NULL,
  festival_date   TEXT,
  preview_url     TEXT,
  sort_order      INT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 27. theme_suite_tasks（主题套装生成任务表）
-- ============================================================
CREATE TABLE IF NOT EXISTS theme_suite_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id          TEXT NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  suite_id        TEXT NOT NULL REFERENCES theme_suites(id),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  result_url      TEXT,
  moderation_result TEXT CHECK (moderation_result IN ('pass','review','block')),
  quota_consumed  BOOLEAN NOT NULL DEFAULT TRUE,
  retry_count     INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_theme_task_active ON theme_suite_tasks(pet_id) WHERE status IN ('pending','processing');
CREATE INDEX IF NOT EXISTS idx_theme_suite_tasks_user ON theme_suite_tasks(user_id, created_at DESC);

-- ============================================================
-- 28. try_on_history（试穿历史记录表）
-- ============================================================
CREATE TABLE IF NOT EXISTS try_on_history (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id          TEXT NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  outfit_snapshot JSONB NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_try_on_history_user ON try_on_history(user_id, created_at DESC);

-- ============================================================
-- 29. audit_log（操作审计日志表）
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id            BIGSERIAL PRIMARY KEY,
  user_id       TEXT NOT NULL,
  action        TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id   TEXT,
  detail        JSONB DEFAULT '{}',
  ip_address    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);

-- ============================================================
-- 30. token_blacklist（JWT 黑名单表）
-- ============================================================
CREATE TABLE IF NOT EXISTS token_blacklist (
  id            BIGSERIAL PRIMARY KEY,
  token_jti     TEXT NOT NULL UNIQUE,
  user_id       TEXT NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  revoked_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason        TEXT
);

CREATE INDEX IF NOT EXISTS idx_token_blacklist_jti ON token_blacklist(token_jti);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);

-- ============================================================
-- 31. pet_families（宠物家庭）
-- ============================================================
CREATE TABLE IF NOT EXISTS pet_families (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 32. pet_family_members（家庭成员）
-- ============================================================
CREATE TABLE IF NOT EXISTS pet_family_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  UUID NOT NULL REFERENCES pet_families(id) ON DELETE CASCADE,
  pet_id     TEXT NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  role       TEXT,
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, pet_id)
);

-- ============================================================
-- 33. pet_lineage（血统关系）
-- ============================================================
CREATE TABLE IF NOT EXISTS pet_lineage (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id    TEXT NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  child_id     TEXT NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  litter_date  DATE,
  UNIQUE(parent_id, child_id)
);

-- ============================================================
-- 34. pet_moments（宠物时刻）
-- ============================================================
CREATE TABLE IF NOT EXISTS pet_moments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id   UUID REFERENCES pet_families(id),
  pet_id      TEXT REFERENCES pet_profiles(id),
  type        TEXT NOT NULL,
  content     JSONB NOT NULL,
  photos      TEXT[],
  ai_summary  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moments_family ON pet_moments(family_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moments_pet ON pet_moments(pet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moments_user ON pet_moments(user_id, created_at DESC);

-- ============================================================
-- 35. pet_milestones（宠物里程碑）
-- ============================================================
CREATE TABLE IF NOT EXISTS pet_milestones (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id    TEXT NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  title     TEXT NOT NULL,
  date      DATE NOT NULL,
  type      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_milestones_pet ON pet_milestones(pet_id, date DESC);

-- ============================================================
-- 36. pet_names（宠物取名）
-- ============================================================
CREATE TABLE IF NOT EXISTS pet_names (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id    TEXT NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  chosen    BOOLEAN DEFAULT FALSE,
  analysis  JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pet_id, name)
);

-- ============================================================
-- 37. pet_facts（宠物特征/喜好/习惯记录表）
-- ============================================================
CREATE TABLE IF NOT EXISTS pet_facts (
  id            BIGSERIAL PRIMARY KEY,
  pet_id        TEXT NOT NULL,
  user_id       TEXT NOT NULL,
  category      TEXT NOT NULL DEFAULT 'general',
  fact          TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pet_facts_pet ON pet_facts(pet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pet_facts_user ON pet_facts(user_id);

-- ============================================================
-- 38. agent_conversations（Agent 对话持久化）
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_conversations (
  id            BIGSERIAL PRIMARY KEY,
  user_id       TEXT NOT NULL,
  pet_id        TEXT,
  role          TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content       TEXT NOT NULL,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_conv_user ON agent_conversations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_conv_pet ON agent_conversations(pet_id, created_at DESC);

-- ============================================================
-- 39. agent_memories（Agent 结构化记忆，memory-body 核心）
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_memories (
  id            BIGSERIAL PRIMARY KEY,
  user_id       TEXT NOT NULL,
  pet_id        TEXT,
  category      TEXT NOT NULL,
  key           TEXT NOT NULL,
  content       TEXT NOT NULL,
  importance    INTEGER NOT NULL DEFAULT 1,
  confidence    REAL NOT NULL DEFAULT 1.0,
  source        TEXT NOT NULL DEFAULT 'auto',
  evidence      TEXT[],
  last_recalled TIMESTAMPTZ,
  decay_rate    REAL NOT NULL DEFAULT 0.01,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dormant', 'expired', 'contradicted')),
  meta          JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, pet_id, key)
);

CREATE INDEX IF NOT EXISTS idx_agent_mem_user ON agent_memories(user_id, pet_id);
CREATE INDEX IF NOT EXISTS idx_agent_mem_category ON agent_memories(pet_id, category);
CREATE INDEX IF NOT EXISTS idx_agent_mem_importance ON agent_memories(pet_id, importance DESC);
CREATE INDEX IF NOT EXISTS idx_agent_mem_recall ON agent_memories(pet_id, last_recalled DESC NULLS LAST);

-- ============================================================
-- 初始化知识库版本记录
-- ============================================================
INSERT INTO pet_knowledge_base (type, version, source) VALUES
  ('breeds', '1.0.0', 'init'),
  ('food_safety', '1.0.0', 'init'),
  ('symptoms', '1.0.0', 'init'),
  ('vaccine_schedule', '1.0.0', 'init'),
  ('urgency_rules', '1.0.0', 'init')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 定时清理函数: 清理过期 token 黑名单
-- ============================================================
CREATE OR REPLACE FUNCTION cleanup_expired_blacklist()
RETURNS void AS $$
BEGIN
  DELETE FROM token_blacklist WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 试穿历史清理函数: 每用户只保留最近 20 条
-- ============================================================
CREATE OR REPLACE FUNCTION cleanup_try_on_history()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM try_on_history
  WHERE user_id = NEW.user_id
  AND id NOT IN (
    SELECT id FROM try_on_history
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    LIMIT 20
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cleanup_try_on_history ON try_on_history;
CREATE TRIGGER trigger_cleanup_try_on_history
  AFTER INSERT ON try_on_history
  FOR EACH ROW EXECUTE FUNCTION cleanup_try_on_history();

-- ============================================================
-- 自动更新 updated_at 的触发器函数
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为有 updated_at 字段的表创建触发器
DO $$
DECLARE
  tables_with_updated_at TEXT[] := ARRAY[
    'memberships', 'pet_profiles', 'pet_vaccinations',
    'pet_grief_sessions', 'pet_outfits', 'theme_suite_tasks',
    'pet_families', 'avatar_generation_tasks'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables_with_updated_at LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS %I ON %I',
      'trg_update_' || t || '_updated_at', t
    );
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      'trg_update_' || t || '_updated_at', t
    );
  END LOOP;
END;
$$;

-- ============================================================
-- 40. pet_memoir_records（宠物回忆录任务记录）
-- ============================================================
CREATE TABLE IF NOT EXISTS pet_memoir_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id        TEXT NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  memoir_type   TEXT NOT NULL,
  status        TEXT DEFAULT 'pending',
  source_photos TEXT[] NOT NULL,
  source_text   TEXT,
  narrative_structure JSONB,
  video_url     TEXT,
  preview_url   TEXT,
  cost_credits  INTEGER,
  payment_id    TEXT,
  error_message TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_memoir_records_user ON pet_memoir_records(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memoir_records_status ON pet_memoir_records(status) WHERE status = 'pending';

-- ============================================================
-- 40. pet_family_feeds（家庭动态墙）
-- ============================================================
CREATE TABLE IF NOT EXISTS pet_family_feeds (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id     UUID NOT NULL REFERENCES pet_families(id) ON DELETE CASCADE,
  pet_id        TEXT REFERENCES pet_profiles(id) ON DELETE SET NULL,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feed_type     TEXT NOT NULL,
  content       TEXT NOT NULL,
  photos        TEXT[],
  ai_generated  BOOLEAN DEFAULT FALSE,
  source_ref    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feeds_family ON pet_family_feeds(family_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feeds_type ON pet_family_feeds(family_id, feed_type);

-- ============================================================
-- 41. pet_family_weekly_reports（家庭周报）
-- Phase 1.5：按家庭维度生成周报，记录一周健康/活动/家庭统计
-- UNIQUE(family_id, year, week_number) 防止同周重复生成
-- ============================================================
CREATE TABLE IF NOT EXISTS pet_family_weekly_reports (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id      UUID NOT NULL REFERENCES pet_families(id) ON DELETE CASCADE,
  week_number    INTEGER NOT NULL,
  year           INTEGER NOT NULL,
  report_data    JSONB NOT NULL,
  ai_insight     TEXT,
  share_card_url TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, year, week_number)
);

CREATE INDEX IF NOT EXISTS idx_weekly_reports_family ON pet_family_weekly_reports(family_id, year DESC, week_number DESC);

-- ============================================================
-- 42. share_cards（分享卡片）
-- Phase 1.5：用户生成分享卡片，记录 card_type/card_data/share_count
-- card_data 为 JSONB：插入时 JSON.stringify，用于存储 source_data/style 等卡片渲染信息
-- share_count 记录分享次数，share_channel 记录最近一次分享渠道
-- ============================================================
CREATE TABLE IF NOT EXISTS share_cards (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_type     TEXT NOT NULL,
  card_data     JSONB NOT NULL,
  card_url      TEXT,
  share_channel TEXT,
  share_count   INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_share_cards_user ON share_cards(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_share_cards_type ON share_cards(card_type, created_at DESC);

-- ============================================================
-- 43. pet_relationships（宠物关系 - 血缘+非血缘）
-- Phase 1.5：家族图谱模块，记录宠物之间的各种关系（朋友/对手/伴侣/配偶等）
-- UNIQUE(pet_id_a, pet_id_b, relation_type) 防止同类型关系重复
-- 注：pet_profiles.id 为 TEXT，故 pet_id_a/pet_id_b 用 TEXT
-- ============================================================
CREATE TABLE IF NOT EXISTS pet_relationships (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id     UUID NOT NULL REFERENCES pet_families(id) ON DELETE CASCADE,
  pet_id_a      TEXT NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  pet_id_b      TEXT NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,
  direction     TEXT,
  label_a       TEXT,
  label_b       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pet_id_a, pet_id_b, relation_type)
);

CREATE INDEX IF NOT EXISTS idx_relationships_family ON pet_relationships(family_id);
CREATE INDEX IF NOT EXISTS idx_relationships_pet_a ON pet_relationships(pet_id_a);
CREATE INDEX IF NOT EXISTS idx_relationships_pet_b ON pet_relationships(pet_id_b);

-- ============================================================
-- 44. pet_lineage 扩展字段（family_id, created_at）
-- 原 pet_lineage 表已存在（id/parent_id/child_id/litter_date），
-- 此处补充 family_id（用于家庭隔离过滤）和 created_at（用于排序）
-- 使用 DO 块做幂等 ALTER，避免重复执行报错
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pet_lineage' AND column_name = 'family_id'
  ) THEN
    ALTER TABLE pet_lineage
      ADD COLUMN family_id UUID REFERENCES pet_families(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pet_lineage' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE pet_lineage
      ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_lineage_family ON pet_lineage(family_id);
CREATE INDEX IF NOT EXISTS idx_lineage_parent ON pet_lineage(parent_id);
CREATE INDEX IF NOT EXISTS idx_lineage_child ON pet_lineage(child_id);

-- ============================================================
-- 45. pet_family_graph_snapshots（家族图谱快照）
-- Phase 1.5：保存家族图谱的布局快照，支持历史回看和分享
-- graph_data 为 JSONB：插入时 JSON.stringify，包含 nodes/edges 等图谱结构
-- ============================================================
CREATE TABLE IF NOT EXISTS pet_family_graph_snapshots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id     UUID NOT NULL REFERENCES pet_families(id) ON DELETE CASCADE,
  layout_type   TEXT NOT NULL,
  graph_data    JSONB NOT NULL,
  thumbnail_url TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_family ON pet_family_graph_snapshots(family_id, created_at DESC);

-- ============================================================
-- 46. pet_roles（宠物角色）
-- Phase 1.5：宠物在家庭中的角色（如：家长/孩子/哥哥/妹妹等）
-- UNIQUE(pet_id, role_type) 防止同一宠物重复担任同类型角色
-- ============================================================
CREATE TABLE IF NOT EXISTS pet_roles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id        TEXT NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  family_id     UUID NOT NULL REFERENCES pet_families(id) ON DELETE CASCADE,
  role_type     TEXT NOT NULL,
  assignment    TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pet_id, role_type)
);

CREATE INDEX IF NOT EXISTS idx_roles_family ON pet_roles(family_id);
CREATE INDEX IF NOT EXISTS idx_roles_pet ON pet_roles(pet_id);

-- ============================================================
-- 47. pet_yearly_reviews（年度回忆图集）
-- Phase 1.5：每只宠物每年的回顾图集，含统计/月度亮点/里程碑/成长曲线
-- UNIQUE(pet_id, year) 防止同一宠物同一年重复创建
-- ============================================================
CREATE TABLE IF NOT EXISTS pet_yearly_reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id        TEXT NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  year          INTEGER NOT NULL,
  status        TEXT NOT NULL DEFAULT 'draft',
  review_data   JSONB NOT NULL DEFAULT '{}'::jsonb,
  cover_url     TEXT,
  video_url     TEXT,
  paid          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(pet_id, year)
);

CREATE INDEX IF NOT EXISTS idx_yearly_reviews_user ON pet_yearly_reviews(user_id, year DESC);
CREATE INDEX IF NOT EXISTS idx_yearly_reviews_pet ON pet_yearly_reviews(pet_id, year DESC);

-- ============================================================
-- 48. pet_leaderboard_snapshots（家庭排行榜快照）
-- Phase 1.5：缓存家庭周/月/总榜数据，避免实时聚合查询
-- ============================================================
CREATE TABLE IF NOT EXISTS pet_leaderboard_snapshots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id     UUID NOT NULL REFERENCES pet_families(id) ON DELETE CASCADE,
  period        TEXT NOT NULL,
  rankings      JSONB NOT NULL DEFAULT '[]'::jsonb,
  computed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(family_id, period)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_family ON pet_leaderboard_snapshots(family_id, period);
