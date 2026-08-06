-- 016_analytics_events.sql
-- 埋点事件表：接收小程序端批量上报的用户行为事件
-- 数据源：北极星指标（每周打卡活跃）与注册/激活/打卡/付费漏斗分析

CREATE TABLE IF NOT EXISTS analytics_events (
  id         BIGSERIAL PRIMARY KEY,
  -- 用户删除账号时联动删除其事件，兑现"一键删除所有记录"的隐私承诺
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  pet_id     UUID REFERENCES pets(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}',
  platform   TEXT NOT NULL DEFAULT 'weapp',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 按时间倒序查询事件流 / 按事件名聚合统计
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name, created_at DESC);
