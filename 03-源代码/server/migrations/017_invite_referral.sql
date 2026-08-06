-- 017_invite_referral.sql
-- 邀请裂变：邀请码 / 分享记录 / 推荐关系（奖励达标后发放会员天数）

-- 1. 邀请码表：每个用户一个唯一邀请码
CREATE TABLE IF NOT EXISTS invite_codes (
  user_id    UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  code       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. 分享记录表：记录用户分享动作（分享统计与后续分析用）
CREATE TABLE IF NOT EXISTS share_records (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_type   TEXT NOT NULL,
  pet_id      UUID REFERENCES pets(id) ON DELETE SET NULL,
  platform    TEXT NOT NULL DEFAULT 'wechat',
  invite_code TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_share_records_user ON share_records(user_id, created_at DESC);

-- 3. 推荐关系表：被邀请人注册后落一条；奖励按“未发放”记录累计
CREATE TABLE IF NOT EXISTS referral_records (
  id             BIGSERIAL PRIMARY KEY,
  inviter_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitee_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invite_code    TEXT NOT NULL,
  reward_granted BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (invitee_id)
);
CREATE INDEX IF NOT EXISTS idx_referral_inviter ON referral_records(inviter_id, reward_granted);