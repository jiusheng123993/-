-- [迁移校准 2026-09-09] 本迁移已被生产等价实现取代（生产表结构以现状为准，不可重放，仅作历史归档）。
-- App/H5 手机号登录支持：为 users 表添加 phone 字段
-- 手机号唯一索引，用于手机号验证码登录
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- 手机号用户没有微信 openid，必须允许为空（微信登录用户仍会写入 openid）
ALTER TABLE users ALTER COLUMN openid DROP NOT NULL;
