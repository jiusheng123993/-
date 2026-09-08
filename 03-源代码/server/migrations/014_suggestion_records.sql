-- 014_suggestion_records.sql
-- AI 建议记录表（效果追踪模块）
-- 存储喂养/症状/趋势/对话类 AI 建议，支持采纳/忽略状态追踪

-- 2026-09-09 校准：原脚本 pet_id UUID REFERENCES pets(id) 双重错误——生产无 pets 表（实际 pet_profiles.id=text，
-- 与 012/013 同类问题，08-23 部署记录在案）。本脚本按生产 schema 修正后补跑（原版从未成功执行过）。
CREATE TABLE IF NOT EXISTS pet_suggestion_records (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id       TEXT NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('feeding', 'symptom', 'trend', 'chat')),
  title        TEXT NOT NULL,
  content      TEXT NOT NULL,
  priority     TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  adopted      BOOLEAN NOT NULL DEFAULT FALSE,
  adopted_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suggestion_records_pet ON pet_suggestion_records(pet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suggestion_records_user ON pet_suggestion_records(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suggestion_records_adopted ON pet_suggestion_records(user_id, adopted);
