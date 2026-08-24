-- 迁移 031：品种知识库热更新表
-- 结构复刻 knowledge_graphs（JSONB 单文档版本表）：
--   服务端权威品种库，前端启动时拉取最新版本实现"不发版修订数据"；
--   空表由服务端惰性播种种子（server/src/data/breedSeed.json，与前端 breeds.ts 兜底一致）。
-- data 内结构：{ version, updatedAt, breeds: BreedItem[] }（BreedItem 见小程序 data/petKnowledge/breeds.ts）

CREATE TABLE IF NOT EXISTS breed_knowledge (
  id SERIAL PRIMARY KEY,
  version TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE breed_knowledge IS '品种知识库版本表（JSONB 单文档，服务端权威 + 前端静态兜底，复刻 knowledge_graphs 热更新模式）';

-- 表归属应用用户（部署环境 owner 问题规避：与既有迁移口径一致）
ALTER TABLE breed_knowledge OWNER TO xinghuanhai;
