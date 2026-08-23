-- 012_chronic_records.sql
-- 宠物慢性病记录表（慢性病追踪模块云端持久化）
--
-- ⚠️ 2026-08-23 修正：原版外键引用 `pets(id)`（该表不存在），生产库实际为
-- `pet_profiles(id)`（text 类型）。此修正与生产 schema 对齐，避免
-- "relation pets does not exist" 建表失败（此前 500 根因之一）。

CREATE TABLE IF NOT EXISTS pet_chronic_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id            TEXT NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  condition         TEXT NOT NULL,
  diagnosed_date    DATE NOT NULL,
  severity          TEXT NOT NULL DEFAULT 'moderate'
                    CHECK (severity IN ('mild', 'moderate', 'severe')),
  status            TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'managed', 'resolved')),
  medications       JSONB NOT NULL DEFAULT '[]',
  vet_name          TEXT,
  vet_contact       TEXT,
  next_checkup_date DATE,
  notes             TEXT,
  symptoms          JSONB NOT NULL DEFAULT '[]',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chronic_records_pet ON pet_chronic_records(pet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chronic_records_user ON pet_chronic_records(user_id, created_at DESC);
