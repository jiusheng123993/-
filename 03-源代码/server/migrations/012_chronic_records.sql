-- 012_chronic_records.sql
-- 宠物慢性病记录表（慢性病追踪模块云端持久化）

CREATE TABLE IF NOT EXISTS pet_chronic_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id            UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
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
