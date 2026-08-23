-- 022 知识图谱与纠错反馈（Phase 3：图谱热更新 + 用户纠错审核流程）
-- 知识图谱版本表：服务端为权威源，小程序启动时拉取最新版本，静态数据仅作离线兜底
CREATE TABLE IF NOT EXISTS knowledge_graphs (
  id SERIAL PRIMARY KEY,
  version TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 知识纠错反馈表：用户在小程序纠错 → 管理员在轻量后台核查 → approve/reject
CREATE TABLE IF NOT EXISTS knowledge_feedback (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  pet_id TEXT,
  check_id TEXT,
  entity_type TEXT NOT NULL,          -- disease / risk_level / advice / other
  entity_name TEXT NOT NULL,          -- 被纠错的实体（疾病名/规则名/建议）
  suggestion TEXT NOT NULL,           -- 用户建议/反馈内容
  status TEXT NOT NULL DEFAULT 'open', -- open / approved / rejected
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_knowledge_feedback_status ON knowledge_feedback (status);
CREATE INDEX IF NOT EXISTS idx_knowledge_feedback_user ON knowledge_feedback (user_id);
