-- 007_pet_moments.sql
-- 宠物时光回忆表

CREATE TABLE IF NOT EXISTS pet_moments (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  pet_id      TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'memory',
  content     JSONB NOT NULL DEFAULT '{}',
  photos      TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pet_moments_user ON pet_moments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pet_moments_pet ON pet_moments(pet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pet_moments_type ON pet_moments(type, created_at DESC);