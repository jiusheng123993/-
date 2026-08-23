-- 023 Agent 对话成本日志（AI 算账：每轮对话记录意图/工具链/token/耗时）
-- 目的：回答"每个用户每天烧多少 AI 钱、哪类对话最贵、出问题能查调用链"
CREATE TABLE IF NOT EXISTS agent_conversation_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  pet_id TEXT,
  intent TEXT,                       -- 意图分类结果（chat/checkin/symptom/...）
  tool_chain TEXT[] NOT NULL DEFAULT '{}', -- 本轮调用的工具名序列（如 {check_symptom,search_hospital}）
  iterations INT NOT NULL DEFAULT 0, -- 主循环迭代轮数
  prompt_tokens INT NOT NULL DEFAULT 0,   -- 累计输入 token（含意图分类）
  completion_tokens INT NOT NULL DEFAULT 0, -- 累计输出 token
  duration_ms INT NOT NULL DEFAULT 0, -- 总耗时
  status TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'timeout', 'error')), -- ok / timeout / error
  error TEXT,                        -- 错误摘要（脱敏，代码层截断 500）
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_conversation_logs_user_time
  ON agent_conversation_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_conversation_logs_time
  ON agent_conversation_logs (created_at DESC);
