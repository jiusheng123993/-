-- 024 兑换码系统（2026-08-23）：管理后台生成兑换码 → 用户兑换发会员
CREATE TABLE IF NOT EXISTS redeem_codes (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,          -- 兑换码（如 XHH-XXXX-XXXX）
  days INT NOT NULL,                  -- 兑换获得的会员天数
  note TEXT,                          -- 备注（发给谁/用途）
  status TEXT NOT NULL DEFAULT 'unused' CHECK (status IN ('unused', 'used')),
  used_by TEXT,                       -- 兑换用户 ID
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_redeem_codes_status ON redeem_codes (status);
