-- 013_feeding_records.sql
-- 宠物喂养记录表（喂养记录模块云端持久化）
--
-- ⚠️ 2026-08-23 修正：原版外键引用 `pets(id)`（该表不存在），生产库实际为
-- `pet_profiles(id)`（text 类型）。此修正与生产 schema 对齐，避免
-- "relation pets does not exist" 建表失败（此前 500 根因之一）。

CREATE TABLE IF NOT EXISTS pet_feeding_records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id      TEXT NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  food_type   TEXT NOT NULL,
  brand       TEXT,
  amount      NUMERIC(8,2) NOT NULL DEFAULT 0,
  unit        TEXT,
  meal_time   TEXT,
  appetite    TEXT CHECK (appetite IN ('good', 'normal', 'poor')),
  stool       TEXT CHECK (stool IN ('normal', 'loose', 'hard')),
  energy      TEXT CHECK (energy IN ('high', 'normal', 'low')),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feeding_records_pet ON pet_feeding_records(pet_id, record_date DESC);
CREATE INDEX IF NOT EXISTS idx_feeding_records_user ON pet_feeding_records(user_id, record_date DESC);
