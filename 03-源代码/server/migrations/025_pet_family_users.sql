-- 025 多成员共同养宠（2026-08-24）：家庭成员（人）关联表
-- 背景：现有 pet_family_members 只关联"宠物→家庭"，家里没有"人"；
-- 本迁移新增 pet_family_users（家庭←→用户），支撑情侣/家庭共同养宠：
--   - 宠物访问权限：宠物主人 OR 家庭成员（见 petRepository.canAccess）
--   - 家庭管理权限：仅 role=owner 可邀请/移除成员
CREATE TABLE IF NOT EXISTS pet_family_users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  UUID NOT NULL REFERENCES pet_families(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_family_users_user ON pet_family_users(user_id);
CREATE INDEX IF NOT EXISTS idx_family_users_family ON pet_family_users(family_id);

-- 回填：现有家庭的创建者即 owner（幂等，老用户零感知）
INSERT INTO pet_family_users (family_id, user_id, role)
SELECT f.id, f.user_id, 'owner'
FROM pet_families f
ON CONFLICT (family_id, user_id) DO NOTHING;
