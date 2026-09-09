-- 036_memoir_prompt_confirmation.sql
-- 回忆录提示词人机协同（2026-09-09）：用户确认的「最终版提示词」留存作证
--
-- 背景：用户对「标准/完整回忆录」要求在生成前把将用提示词给他看，并可多轮提修改要求，
-- 直到确认「这就是最终版」才会生成——留存这份确认版，一方面作「用户认可依据」防扯皮，
-- 另一方面供生成管线优先采用（生成时用用户确认过的版本，而非重新生成）。
--
-- 结构：按 (user_id, pet_id) 一行（一宠一档的最终确认），重复确认覆盖（幂等）。
-- 部署：遇 "must be owner of table" 用 sudo -u postgres psql 执行，并
--       ALTER TABLE memoir_prompt_confirmations OWNER TO <应用用户>（见部署配置规范）。

CREATE TABLE IF NOT EXISTS memoir_prompt_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  pet_id TEXT NOT NULL REFERENCES pet_profiles(id),
  tier TEXT NOT NULL CHECK (tier IN ('light', 'standard', 'full')),
  script JSONB NOT NULL,
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, pet_id, tier)
);

CREATE INDEX IF NOT EXISTS idx_memoir_prompt_confirm_pet ON memoir_prompt_confirmations (pet_id);
