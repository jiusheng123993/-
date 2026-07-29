-- 006_pet_facts.sql
-- 宠物特征/喜好/习惯记录表

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