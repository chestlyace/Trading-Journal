-- ============================================================
-- 007_create_ai_insights.sql
-- ============================================================

CREATE TYPE insight_type AS ENUM (
  'PATTERN',
  'RISK_ALERT',
  'EMOTIONAL',
  'STRATEGY',
  'GOAL',
  'WEEKLY_SUMMARY',
  'TRADE_NOTE',
  'ANOMALY'
);

CREATE TABLE ai_insights (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type   insight_type NOT NULL,
  title          TEXT NOT NULL,
  body           TEXT NOT NULL,
  supporting_data JSONB,
  is_read        BOOLEAN NOT NULL DEFAULT FALSE,
  is_dismissed   BOOLEAN NOT NULL DEFAULT FALSE,
  generated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at     TIMESTAMPTZ
);

CREATE INDEX idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX idx_ai_insights_unread
  ON ai_insights(user_id, is_read, is_dismissed);

