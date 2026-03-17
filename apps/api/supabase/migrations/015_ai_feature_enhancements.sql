-- ============================================================
-- 015_ai_feature_enhancements.sql
-- ============================================================

-- Add trade_id to ai_insights for trade-level notes
ALTER TABLE ai_insights ADD COLUMN trade_id UUID REFERENCES trades(id) ON DELETE CASCADE;
CREATE INDEX idx_ai_insights_trade_id ON ai_insights(trade_id);

-- Add last_ai_analysis_trade_count to user_profiles to track when to trigger pattern detection
ALTER TABLE user_profiles ADD COLUMN last_ai_analysis_trade_count INTEGER NOT NULL DEFAULT 0;

-- Create ai_chat_sessions table
CREATE TABLE ai_chat_sessions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL DEFAULT 'New Conversation',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_chat_sessions_user_id ON ai_chat_sessions(user_id);

-- Create ai_chat_messages table
CREATE TABLE ai_chat_messages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id   UUID NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  role         TEXT NOT NULL CHECK (role IN ('user', 'model')),
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_chat_messages_session_id ON ai_chat_messages(session_id);
