-- 005_audit_and_token.sql
-- 审计日志 + Token 黑名单

-- ============================================================
-- 1. audit_log（操作审计日志表）
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id            BIGSERIAL PRIMARY KEY,
  user_id       TEXT NOT NULL,
  action        TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id   TEXT,
  detail        JSONB DEFAULT '{}',
  ip_address    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can write audit log" ON audit_log
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admin can read audit log" ON audit_log
  FOR SELECT USING (auth.role() = 'service_role');

-- ============================================================
-- 2. token_blacklist（JWT 黑名单表）
-- ============================================================
CREATE TABLE IF NOT EXISTS token_blacklist (
  id            BIGSERIAL PRIMARY KEY,
  token_jti     TEXT NOT NULL UNIQUE,
  user_id       TEXT NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  revoked_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason        TEXT
);

CREATE INDEX IF NOT EXISTS idx_token_blacklist_jti ON token_blacklist(token_jti);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);

-- 定期清理过期记录
CREATE OR REPLACE FUNCTION public.fn_cleanup_expired_blacklist()
RETURNS void AS $$
BEGIN
  DELETE FROM token_blacklist WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE token_blacklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage token blacklist" ON token_blacklist
  FOR ALL USING (auth.role() = 'service_role');
