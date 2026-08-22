-- 记忆标签化（回忆录 2.0 F4：记忆驱动回忆录）
-- agent_memories 增加回忆标签（tags）与记忆层级（level）
-- tags：回忆维度标签（milestone/daily_joy/bonding/special_day/family/health_heal/farewell/seasonal）
-- level：core=核心层（回忆录只从这里取）/ flow=流水层（可衰减清理）
ALTER TABLE agent_memories ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE agent_memories ADD COLUMN IF NOT EXISTS level TEXT NOT NULL DEFAULT 'flow';
CREATE INDEX IF NOT EXISTS idx_agent_memories_tags ON agent_memories USING GIN (tags);
