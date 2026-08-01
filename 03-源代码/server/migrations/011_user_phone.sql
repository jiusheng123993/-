-- App/H5 手机号登录支持：为 users 表添加 phone 字段
-- 手机号唯一索引，用于手机号验证码登录
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
