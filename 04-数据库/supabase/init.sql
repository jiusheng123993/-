-- ============================================================
-- 星寰海 Supabase 数据库初始化脚本 (宠物管家 MVP)
-- 版本: v2.0 (Phase 1.5)
-- 更新: 2026-07-21
-- 说明: 替换旧版情绪健康管理表结构为宠物场景表结构
-- 在 Supabase SQL Editor 中执行此脚本
-- ============================================================

-- ============================================================
-- 0. 清理旧版表（如从旧版升级，先删除旧表）
-- ============================================================
-- 注意：首次部署时这些表不存在，DROP IF NULL 安全执行
-- 生产环境升级时请先备份数据

DO $$
DECLARE
  old_tables TEXT[] := ARRAY[
    'identities', 'goals', 'tasks', 'notes', 'review_items',
    'focus_sessions', 'growth_state', 'custom_personas', 'persona_schedules',
    'entitlements', 'orders', 'avatars', 'avatar_generations',
    'memory_events', 'habits', 'journals', 'mood_records',
    'exams', 'error_book', 'memory_cards', 'preferences'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY old_tables LOOP
    EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', t);
  END LOOP;
END;
$$;

-- ============================================================
-- 1. profiles（用户扩展表，关联 auth.users）
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT UNIQUE,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. users（微信用户主表）
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
-- 3. memberships（会员订阅）
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
-- 4. pet_profiles（宠物档案）
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
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pet_profiles_user ON pet_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_pet_profiles_species ON pet_profiles(user_id, species);

-- ============================================================
-- 5. pet_health_entries（健康打卡）
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
-- 6. pet_vaccinations（疫苗驱虫记录）
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
-- 7. pet_symptom_checks（症状初筛）
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
-- 8. pet_food_queries（食物安全查询）
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
-- 9. emotion_triggers（情绪触发记录 - 宠物哀伤场景）
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
-- 10. pet_grief_sessions（宠物离世悲伤陪伴）
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
-- 11. usage_quotas（使用配额）
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
-- 12. behavior_logs（行为日志）
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
-- 13. sync_queue（同步队列）
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
-- 14. pet_knowledge_base（知识库版本 - 公开只读）
-- ============================================================
CREATE TABLE IF NOT EXISTS pet_knowledge_base (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT NOT NULL,
  version     TEXT NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now(),
  source      TEXT
);

-- ============================================================
-- 15. hospital_referrals（医院导流）
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
-- 16. payment_orders（支付订单）
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_orders (
  id              TEXT PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan            TEXT NOT NULL CHECK (plan IN ('monthly', 'quarterly', 'yearly')),
  amount          INTEGER NOT NULL CHECK (amount > 0),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded', 'paid')),
  channel         TEXT NOT NULL DEFAULT 'wechat',
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON payment_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(user_id, status) WHERE status = 'pending';

-- ============================================================
-- 17. avatar_generations（AI头像生成记录）
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
-- 18. invite_codes（邀请码）
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
-- 19. share_records（分享记录）
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
-- 20. referral_records（推荐记录）
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
-- RLS 策略
-- ============================================================

-- 辅助函数：为指定表启用 RLS 并创建标准 CRUD 策略
-- 基于 auth.uid() = user_id 的用户数据隔离
CREATE OR REPLACE FUNCTION public.apply_user_rls(table_name TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);

  EXECUTE format('
    CREATE POLICY "Users can view own data" ON %I
      FOR SELECT USING (auth.uid() = user_id)
  ', table_name);

  EXECUTE format('
    CREATE POLICY "Users can insert own data" ON %I
      FOR INSERT WITH CHECK (auth.uid() = user_id)
  ', table_name);

  EXECUTE format('
    CREATE POLICY "Users can update own data" ON %I
      FOR UPDATE USING (auth.uid() = user_id)
  ', table_name);

  EXECUTE format('
    CREATE POLICY "Users can delete own data" ON %I
      FOR DELETE USING (auth.uid() = user_id)
  ', table_name);
END;
$$ LANGUAGE plpgsql;

-- 辅助函数：为 profiles 表启用 RLS（主键即用户ID）
CREATE OR REPLACE FUNCTION public.apply_profile_rls()
RETURNS VOID AS $$
BEGIN
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

  CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

  DROP POLICY IF EXISTS "Users can insert own data" ON profiles;
  DROP POLICY IF EXISTS "Users can delete own data" ON profiles;
END;
$$ LANGUAGE plpgsql;

-- 对所有用户数据表应用 RLS
SELECT public.apply_profile_rls();
SELECT public.apply_user_rls('users');
SELECT public.apply_user_rls('memberships');
SELECT public.apply_user_rls('pet_profiles');
SELECT public.apply_user_rls('pet_health_entries');
SELECT public.apply_user_rls('pet_vaccinations');
SELECT public.apply_user_rls('pet_symptom_checks');
SELECT public.apply_user_rls('pet_food_queries');
SELECT public.apply_user_rls('emotion_triggers');
SELECT public.apply_user_rls('pet_grief_sessions');
SELECT public.apply_user_rls('usage_quotas');
SELECT public.apply_user_rls('behavior_logs');
SELECT public.apply_user_rls('sync_queue');
SELECT public.apply_user_rls('hospital_referrals');
SELECT public.apply_user_rls('payment_orders');
SELECT public.apply_user_rls('avatar_generations');
SELECT public.apply_user_rls('invite_codes');
SELECT public.apply_user_rls('share_records');
SELECT public.apply_user_rls('referral_records');

-- 管理员可读所有用户数据（用于运营后台）
CREATE OR REPLACE FUNCTION public.admin_read_policy(table_name TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format(
    'CREATE POLICY "Admin can read all %s" ON %I
     FOR SELECT USING (
       EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = ''admin'')
     )',
    table_name, table_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT public.admin_read_policy('users');
SELECT public.admin_read_policy('memberships');
SELECT public.admin_read_policy('pet_profiles');
SELECT public.admin_read_policy('pet_health_entries');
SELECT public.admin_read_policy('share_records');
SELECT public.admin_read_policy('referral_records');
SELECT public.admin_read_policy('avatar_generations');
SELECT public.admin_read_policy('behavior_logs');
SELECT public.admin_read_policy('payment_orders');

-- pet_knowledge_base: 公开只读（无 user_id，所有认证用户可读，仅服务端写入）
ALTER TABLE pet_knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read knowledge base" ON pet_knowledge_base
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- pet_health_entries / pet_vaccinations 额外安全策略
-- 防止 A 用户的 pet_id 写入 B 用户的宠物数据
-- ============================================================

-- 验证 pet_id 归属当前用户（通过 pet_profiles.user_id）
CREATE OR REPLACE FUNCTION public.verify_pet_ownership()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pet_profiles WHERE id = NEW.pet_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Pet does not belong to current user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS verify_health_entry_pet_ownership ON pet_health_entries;
CREATE TRIGGER verify_health_entry_pet_ownership
  BEFORE INSERT OR UPDATE ON pet_health_entries
  FOR EACH ROW EXECUTE FUNCTION public.verify_pet_ownership();

DROP TRIGGER IF EXISTS verify_vaccination_pet_ownership ON pet_vaccinations;
CREATE TRIGGER verify_vaccination_pet_ownership
  BEFORE INSERT OR UPDATE ON pet_vaccinations
  FOR EACH ROW EXECUTE FUNCTION public.verify_pet_ownership();

DROP TRIGGER IF EXISTS verify_symptom_check_pet_ownership ON pet_symptom_checks;
CREATE TRIGGER verify_symptom_check_pet_ownership
  BEFORE INSERT OR UPDATE ON pet_symptom_checks
  FOR EACH ROW EXECUTE FUNCTION public.verify_pet_ownership();

-- ============================================================
-- updated_at 自动更新触发器
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_memberships_updated_at ON memberships;
CREATE TRIGGER update_memberships_updated_at
  BEFORE UPDATE ON memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_pet_profiles_updated_at ON pet_profiles;
CREATE TRIGGER update_pet_profiles_updated_at
  BEFORE UPDATE ON pet_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_pet_vaccinations_updated_at ON pet_vaccinations;
CREATE TRIGGER update_pet_vaccinations_updated_at
  BEFORE UPDATE ON pet_vaccinations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_pet_grief_sessions_updated_at ON pet_grief_sessions;
CREATE TRIGGER update_pet_grief_sessions_updated_at
  BEFORE UPDATE ON pet_grief_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- Storage Buckets（存储桶）
-- ============================================================

-- 宠物原始照片存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pet-photos', 'pet-photos', false, 5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- AI生成的卡通形象存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pet-avatars', 'pet-avatars', false, 2097152,
  ARRAY['image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- 用户头像存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-avatars', 'user-avatars', false, 2097152,
  ARRAY['image/jpeg', 'image/png']
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Storage RLS 策略
-- ============================================================

-- pet-photos: 用户只能上传/读取自己宠物ID下的照片
CREATE POLICY "Users can upload own pet photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'pet-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read own pet photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'pet-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own pet photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'pet-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- pet-avatars: 用户只能读取自己宠物ID下的形象
CREATE POLICY "Users can read own pet avatars" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'pet-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- pet-avatars: 仅服务端（Edge Function）可写入
CREATE POLICY "Service role can upload pet avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'pet-avatars'
    AND auth.role() = 'service_role'
  );

-- user-avatars: 用户只能上传/读取自己的头像
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read own avatar" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'user-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- 初始数据：知识库版本记录
-- ============================================================

INSERT INTO pet_knowledge_base (type, version, source) VALUES
  ('breeds', '1.0.0', 'init'),
  ('food_safety', '1.0.0', 'init'),
  ('symptoms', '1.0.0', 'init'),
  ('vaccine_schedule', '1.0.0', 'init'),
  ('urgency_rules', '1.0.0', 'init')
ON CONFLICT DO NOTHING;

-- ============================================================
-- v4.0 新增：宠物家庭系统 + 时光引擎 + 取名引擎
-- ============================================================

CREATE TABLE IF NOT EXISTS pet_families (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE pet_families ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能访问自己的家庭" ON pet_families
  FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS pet_family_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  UUID NOT NULL REFERENCES pet_families(id) ON DELETE CASCADE,
  pet_id     UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  role       TEXT,
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, pet_id)
);
ALTER TABLE pet_family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能看到自己家庭的成员" ON pet_family_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pet_families
      WHERE pet_families.id = family_id
      AND pet_families.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS pet_lineage (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id    UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  child_id     UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  litter_date  DATE,
  UNIQUE(parent_id, child_id)
);
ALTER TABLE pet_lineage ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS pet_moments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id   UUID REFERENCES pet_families(id),
  pet_id      UUID REFERENCES pet_profiles(id),
  type        TEXT NOT NULL,
  content     JSONB NOT NULL,
  photos      TEXT[],
  ai_summary  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_moments_family ON pet_moments(family_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moments_pet ON pet_moments(pet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moments_user ON pet_moments(user_id, created_at DESC);
ALTER TABLE pet_moments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能访问自己的时刻" ON pet_moments
  FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS pet_milestones (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id    UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  title     TEXT NOT NULL,
  date      DATE NOT NULL,
  type      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_milestones_pet ON pet_milestones(pet_id, date DESC);
ALTER TABLE pet_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能访问自己的里程碑" ON pet_milestones
  FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS pet_names (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id    UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  chosen    BOOLEAN DEFAULT FALSE,
  analysis  JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pet_id, name)
);
ALTER TABLE pet_names ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能访问自己的取名记录" ON pet_names
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE pet_profiles ADD COLUMN IF NOT EXISTS litter_date DATE;
ALTER TABLE pet_profiles ADD COLUMN IF NOT EXISTS birth_season TEXT;
