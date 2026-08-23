-- 026 家庭邀请码（2026-08-24）：多成员共同养宠 - 邀请家庭成员加入
-- owner 生成邀请码 → 对方凭码加入家庭（pet_family_users 增加 member）
CREATE TABLE IF NOT EXISTS pet_family_invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID NOT NULL REFERENCES pet_families(id) ON DELETE CASCADE,
  code        TEXT NOT NULL UNIQUE,          -- 6 位邀请码（去易混淆字符）
  created_by  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- 邀请人（owner）
  expires_at  TIMESTAMPTZ NOT NULL,          -- 过期时间（默认 7 天）
  used_by     UUID REFERENCES users(id) ON DELETE SET NULL,         -- 已使用人
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_family_invites_family ON pet_family_invites(family_id);
CREATE INDEX IF NOT EXISTS idx_family_invites_code ON pet_family_invites(code);
