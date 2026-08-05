-- 010_family_photos.sql
-- 全家福AI合成照片表

CREATE TABLE IF NOT EXISTS family_photos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id     UUID NOT NULL REFERENCES pet_families(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL,
  photo_url     TEXT,
  photo_type    TEXT NOT NULL DEFAULT 'ai_generated'
                CHECK (photo_type IN ('ai_generated', 'canvas_fallback', 'uploaded')),
  style         TEXT NOT NULL DEFAULT 'pixar',
  description   TEXT,
  member_count  INTEGER NOT NULL DEFAULT 0,
  member_names  TEXT[] NOT NULL DEFAULT '{}',
  task_id       UUID,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_family_photos_family ON family_photos(family_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_family_photos_user ON family_photos(user_id, created_at DESC);