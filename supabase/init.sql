-- ============================================================
-- 星寰海 Supabase 数据库初始化脚本
-- 在 Supabase SQL Editor 中执行此脚本
-- ============================================================

-- 1. Profiles（用户扩展表，关联 auth.users）
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT UNIQUE,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 自动创建 profile 的触发器
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

-- 2. Identities
CREATE TABLE IF NOT EXISTS identities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'student',
  avatar_emoji  TEXT,
  is_active     BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 3. Goals
CREATE TABLE IF NOT EXISTS goals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  subject     TEXT,
  target_date DATE,
  progress    INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status      TEXT DEFAULT 'active',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 4. Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal_id       UUID REFERENCES goals(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  status        TEXT DEFAULT 'todo',
  minutes       INTEGER DEFAULT 0,
  reward_points INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 5. Notes
CREATE TABLE IF NOT EXISTS notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  subject     TEXT,
  content     TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 6. Review Items
CREATE TABLE IF NOT EXISTS review_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  subject          TEXT,
  due_date         DATE,
  level            TEXT DEFAULT 'medium',
  interval         INTEGER DEFAULT 0,
  ease_factor      REAL DEFAULT 2.5,
  review_count     INTEGER DEFAULT 0,
  last_review_date DATE,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- 7. Focus Sessions
CREATE TABLE IF NOT EXISTS focus_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  duration    INTEGER NOT NULL DEFAULT 0,
  started_at  TIMESTAMPTZ NOT NULL,
  ended_at    TIMESTAMPTZ,
  mode        TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 8. Growth State
CREATE TABLE IF NOT EXISTS growth_state (
  user_id       UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  level         INTEGER DEFAULT 1,
  experience    INTEGER DEFAULT 0,
  streak_days   INTEGER DEFAULT 0,
  achievements  INTEGER DEFAULT 0,
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 9. Custom Personas
CREATE TABLE IF NOT EXISTS custom_personas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  tone            TEXT,
  identity        TEXT,
  avatar_emoji    TEXT,
  is_published    BOOLEAN DEFAULT false,
  safety_status   TEXT DEFAULT 'pending',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 10. Persona Schedules
CREATE TABLE IF NOT EXISTS persona_schedules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  persona_id  TEXT NOT NULL,
  day_of_week INTEGER,
  time_slot   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 11. Entitlements
CREATE TABLE IF NOT EXISTS entitlements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  key         TEXT NOT NULL,
  source      TEXT NOT NULL,
  expires_at  TIMESTAMPTZ,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, key)
);

-- 12. Orders
CREATE TABLE IF NOT EXISTS orders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id     TEXT NOT NULL,
  amount         INTEGER NOT NULL,
  currency       TEXT DEFAULT 'CNY',
  status         TEXT DEFAULT 'pending',
  payment_method TEXT,
  paid_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- 13. Avatars
CREATE TABLE IF NOT EXISTS avatars (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  source        TEXT NOT NULL,
  render_mode   TEXT DEFAULT '2d_sticker',
  thumbnail_url TEXT,
  model_url     TEXT,
  sticker_url   TEXT,
  persona_id    TEXT,
  evolution     JSONB DEFAULT '{}',
  animations    JSONB DEFAULT '[]',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 14. Avatar Generations
CREATE TABLE IF NOT EXISTS avatar_generations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prompt       TEXT NOT NULL,
  style        TEXT,
  render_mode  TEXT,
  status       TEXT DEFAULT 'pending',
  result       JSONB,
  error        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 15. Memory Events
CREATE TABLE IF NOT EXISTS memory_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,
  title        TEXT NOT NULL,
  content      TEXT,
  importance   INTEGER DEFAULT 1 CHECK (importance >= 1 AND importance <= 5),
  tags         TEXT[] DEFAULT '{}',
  forgotten    BOOLEAN DEFAULT false,
  forgotten_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- 16. Habits
CREATE TABLE IF NOT EXISTS habits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  frequency   TEXT DEFAULT 'daily',
  streak      INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 17. Journals
CREATE TABLE IF NOT EXISTS journals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT,
  content     TEXT NOT NULL,
  mood        TEXT,
  tags        TEXT[] DEFAULT '{}',
  entry_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 18. Mood Records
CREATE TABLE IF NOT EXISTS mood_records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mood        TEXT NOT NULL,
  note        TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- 19. Exams
CREATE TABLE IF NOT EXISTS exams (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  subject     TEXT,
  exam_date   DATE,
  score       INTEGER,
  total_score INTEGER,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 20. Error Book
CREATE TABLE IF NOT EXISTS error_book (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question     TEXT NOT NULL,
  answer       TEXT,
  subject      TEXT,
  tags         TEXT[] DEFAULT '{}',
  review_count INTEGER DEFAULT 0,
  mastered     BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- 21. Memory Cards
CREATE TABLE IF NOT EXISTS memory_cards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  front           TEXT NOT NULL,
  back            TEXT NOT NULL,
  subject         TEXT,
  interval        INTEGER DEFAULT 0,
  ease_factor     REAL DEFAULT 2.5,
  review_count    INTEGER DEFAULT 0,
  next_review_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 22. Preferences
CREATE TABLE IF NOT EXISTS preferences (
  user_id        UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  theme_id       TEXT DEFAULT 'minimal-premium',
  theme_mode     TEXT DEFAULT 'light',
  active_persona TEXT,
  ai_settings    JSONB DEFAULT '{}',
  sync_settings  JSONB DEFAULT '{}',
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- RLS 策略：用户只能访问自己的数据
-- ============================================================

-- 辅助函数：为指定表启用 RLS 并创建标准 CRUD 策略
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

-- 对所有用户数据表应用 RLS
SELECT public.apply_user_rls('profiles');
SELECT public.apply_user_rls('identities');
SELECT public.apply_user_rls('goals');
SELECT public.apply_user_rls('tasks');
SELECT public.apply_user_rls('notes');
SELECT public.apply_user_rls('review_items');
SELECT public.apply_user_rls('focus_sessions');
SELECT public.apply_user_rls('growth_state');
SELECT public.apply_user_rls('custom_personas');
SELECT public.apply_user_rls('persona_schedules');
SELECT public.apply_user_rls('entitlements');
SELECT public.apply_user_rls('orders');
SELECT public.apply_user_rls('avatars');
SELECT public.apply_user_rls('avatar_generations');
SELECT public.apply_user_rls('memory_events');
SELECT public.apply_user_rls('habits');
SELECT public.apply_user_rls('journals');
SELECT public.apply_user_rls('mood_records');
SELECT public.apply_user_rls('exams');
SELECT public.apply_user_rls('error_book');
SELECT public.apply_user_rls('memory_cards');
SELECT public.apply_user_rls('preferences');

-- ============================================================
-- 索引
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_goals_user_status ON goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_goal ON tasks(user_id, goal_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user ON focus_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_memory_events_user_type ON memory_events(user_id, type);
CREATE INDEX IF NOT EXISTS idx_journals_user_date ON journals(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_mood_records_user ON mood_records(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_user_key ON entitlements(user_id, key);
CREATE INDEX IF NOT EXISTS idx_memory_cards_due ON memory_cards(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_error_book_user ON error_book(user_id, mastered);
