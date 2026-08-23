-- 028: 宠物形象库表（2026-08-24）
-- 用户多次生成形象后保存到形象库，按风格/表情分类管理
-- 幂等：IF NOT EXISTS，可重复执行
-- ⚠️ user_id 必须用 UUID：users.id 是 uuid 类型，用 TEXT 建外键会报
--    "incompatible types: text and uuid"（本地 PG18 实证），部署必失败
CREATE TABLE IF NOT EXISTS pet_avatar_library (
  id           TEXT PRIMARY KEY,
  pet_id       TEXT NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  style        TEXT NOT NULL,                -- 画风 key（q / japanese / american / watercolor / clay）
  expression   TEXT,                         -- 表情 key（happy / excited / ...，可为空）
  image_url    TEXT NOT NULL,                -- 形象图片 URL
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- 同一张图不重复收藏
  UNIQUE (pet_id, image_url)
);

-- 按宠物查询形象库（时间倒序）
CREATE INDEX IF NOT EXISTS idx_avatar_library_pet ON pet_avatar_library (pet_id, created_at DESC);
