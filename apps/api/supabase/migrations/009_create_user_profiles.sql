-- ============================================================
-- 009_create_user_profiles.sql
-- ============================================================

CREATE TABLE user_profiles (
  user_id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name      TEXT,
  timezone          TEXT NOT NULL DEFAULT 'UTC',
  home_currency     CHAR(3) NOT NULL DEFAULT 'USD',
  trading_style     TEXT[],
  onboarding_done   BOOLEAN NOT NULL DEFAULT FALSE,
  ai_analysis_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  push_token        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

