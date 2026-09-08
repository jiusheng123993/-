-- [迁移校准 2026-09-09] 本迁移已被生产等价实现取代（生产表结构以现状为准，不可重放，仅作历史归档）。
-- 003_avatar_generation_tables.sql
-- 宠物形象生成相关表

-- 生成任务表
CREATE TABLE IF NOT EXISTS avatar_generation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  pet_id UUID NOT NULL,
  task_type VARCHAR(10) NOT NULL CHECK (task_type IN ('2d', '3d')),
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

-- 2D 形象图片表
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

-- 3D 模型表
CREATE TABLE IF NOT EXISTS avatar_3d_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES avatar_generation_tasks(id) ON DELETE CASCADE,
  model_url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_avatar_3d_task_id ON avatar_3d_models(task_id);