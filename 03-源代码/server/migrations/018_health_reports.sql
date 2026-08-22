-- 体检记录表（回忆录 2.0 F8：体检报告识别）
-- 用户上传体检报告照片 → visionService 提取结构化指标 → 存此表 + 写健康事件记忆
CREATE TABLE IF NOT EXISTS health_reports (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id        TEXT NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  -- 体检日期（用户选择或从报告识别；可空则取创建时间）
  report_date   DATE,
  -- 结构化指标（JSON：[{name, value, unit, range, abnormal}]）
  metrics       JSONB NOT NULL DEFAULT '[]',
  -- 原始识别文本（保留供审计/校对）
  raw_text      TEXT,
  -- 来源：vision=AI 识别 / manual=手动录入
  source        TEXT NOT NULL DEFAULT 'vision',
  -- 关联健康事件记忆的 evidence（可回溯）
  memory_key    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_health_reports_pet ON health_reports (pet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_reports_user ON health_reports (user_id);
