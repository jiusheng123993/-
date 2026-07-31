-- 008_pet_food_safety_knowledge.sql
-- 宠物食物安全知识库（从权威数据源爬取编排）
-- 与前端本地数据互补，作为后端 AI Agent 的主要查询来源

CREATE TABLE IF NOT EXISTS pet_food_safety_knowledge (
  id                  TEXT PRIMARY KEY,
  food_name           TEXT NOT NULL,
  aliases             TEXT[] DEFAULT '{}',
  safety_level        TEXT NOT NULL CHECK (safety_level IN ('safe', 'caution', 'dangerous', 'toxic')),
  species_applicable  TEXT[] DEFAULT '{}',
  detail              TEXT,
  dangerous_compounds TEXT[] DEFAULT '{}',
  toxic_doses         TEXT,
  symptoms            TEXT[] DEFAULT '{}',
  first_aid           TEXT,
  source              TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'scraped', 'ai_generated')),
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- 支持 ILIKE 模糊搜索和别名搜索
CREATE INDEX IF NOT EXISTS idx_food_safety_knowledge_name ON pet_food_safety_knowledge(food_name);
CREATE INDEX IF NOT EXISTS idx_food_safety_knowledge_aliases ON pet_food_safety_knowledge USING GIN(aliases);
CREATE INDEX IF NOT EXISTS idx_food_safety_knowledge_level ON pet_food_safety_knowledge(safety_level);
