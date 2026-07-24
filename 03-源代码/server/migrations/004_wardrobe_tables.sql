-- 004_wardrobe_tables.sql
-- 宠物换装系统相关表

-- ============================================================
-- 1. accessories（全局饰品配置表，无 user_id）
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

ALTER TABLE accessories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read accessories" ON accessories
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can write accessories" ON accessories
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 2. user_accessory_inventory（用户饰品库存表）
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

ALTER TABLE user_accessory_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own accessory inventory" ON user_accessory_inventory
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accessory inventory" ON user_accessory_inventory
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accessory inventory" ON user_accessory_inventory
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accessory inventory" ON user_accessory_inventory
  FOR DELETE USING (auth.uid() = user_id);

SELECT public.admin_read_policy('user_accessory_inventory');

-- ============================================================
-- 3. pet_outfits（宠物装备表，每只宠物一行）
-- ============================================================
CREATE TABLE IF NOT EXISTS pet_outfits (
  pet_id          TEXT PRIMARY KEY REFERENCES pet_profiles(id) ON DELETE CASCADE,
  outfit_slots    JSONB NOT NULL DEFAULT '{}',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE pet_outfits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own pet outfit" ON pet_outfits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pet_profiles
      WHERE pet_profiles.id = pet_outfits.pet_id
      AND pet_profiles.user_id = auth.uid()
    )
  );

DROP TRIGGER IF EXISTS update_pet_outfits_updated_at ON pet_outfits;
CREATE TRIGGER update_pet_outfits_updated_at
  BEFORE UPDATE ON pet_outfits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 4. theme_suites（全局主题套装配置表，无 user_id）
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

ALTER TABLE theme_suites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read theme suites" ON theme_suites
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can write theme suites" ON theme_suites
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 5. theme_suite_tasks（主题套装生成任务表）
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

ALTER TABLE theme_suite_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own theme suite tasks" ON theme_suite_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own theme suite tasks" ON theme_suite_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own theme suite tasks" ON theme_suite_tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own theme suite tasks" ON theme_suite_tasks
  FOR DELETE USING (auth.uid() = user_id);

SELECT public.admin_read_policy('theme_suite_tasks');

DROP TRIGGER IF EXISTS verify_theme_suite_task_pet_ownership ON theme_suite_tasks;
CREATE TRIGGER verify_theme_suite_task_pet_ownership
  BEFORE INSERT OR UPDATE ON theme_suite_tasks
  FOR EACH ROW EXECUTE FUNCTION public.verify_pet_ownership();

DROP TRIGGER IF EXISTS update_theme_suite_tasks_updated_at ON theme_suite_tasks;
CREATE TRIGGER update_theme_suite_tasks_updated_at
  BEFORE UPDATE ON theme_suite_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 6. try_on_history（试穿历史记录表）
-- ============================================================
CREATE TABLE IF NOT EXISTS try_on_history (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id          TEXT NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  outfit_snapshot JSONB NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_try_on_history_user ON try_on_history(user_id, created_at DESC);

ALTER TABLE try_on_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own try on history" ON try_on_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own try on history" ON try_on_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own try on history" ON try_on_history
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own try on history" ON try_on_history
  FOR DELETE USING (auth.uid() = user_id);

SELECT public.admin_read_policy('try_on_history');

DROP TRIGGER IF EXISTS verify_try_on_history_pet_ownership ON try_on_history;
CREATE TRIGGER verify_try_on_history_pet_ownership
  BEFORE INSERT OR UPDATE ON try_on_history
  FOR EACH ROW EXECUTE FUNCTION public.verify_pet_ownership();

-- 试穿历史清理：每用户只保留最近 20 条
CREATE OR REPLACE FUNCTION public.fn_cleanup_try_on_history()
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS cleanup_try_on_history ON try_on_history;
CREATE TRIGGER cleanup_try_on_history
  AFTER INSERT ON try_on_history
  FOR EACH ROW EXECUTE FUNCTION public.fn_cleanup_try_on_history();

-- ============================================================
-- 7. pet_profiles 新增字段
-- ============================================================
ALTER TABLE pet_profiles ADD COLUMN IF NOT EXISTS outfit_summary JSONB;
ALTER TABLE pet_profiles ADD COLUMN IF NOT EXISTS theme_suite_url TEXT;

-- ============================================================
-- 8. avatar_generation_tasks 扩展 task_type 枚举
-- ============================================================
ALTER TABLE avatar_generation_tasks DROP CONSTRAINT IF EXISTS avatar_generation_tasks_task_type_check;
ALTER TABLE avatar_generation_tasks ADD CONSTRAINT avatar_generation_tasks_task_type_check
  CHECK (task_type IN ('2d', '3d', 'theme_suite'));

-- ============================================================
-- 9. Storage Bucket: theme-suites
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'theme-suites', 'theme-suites', false, 2097152,
  ARRAY['image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 10. Storage RLS: theme-suites bucket
-- ============================================================
CREATE POLICY "Users can read own theme suite images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'theme-suites'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Service role can write theme suite images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'theme-suites'
    AND auth.role() = 'service_role'
  );
