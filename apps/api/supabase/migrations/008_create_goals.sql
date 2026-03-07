-- ============================================================
-- 008_create_goals.sql
-- ============================================================

CREATE TYPE goal_period AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

CREATE TABLE goals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period          goal_period NOT NULL,
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  target_pnl      NUMERIC(15, 2),
  target_win_rate NUMERIC(5, 2),
  target_rr_ratio NUMERIC(8, 4),
  max_risk_pct    NUMERIC(5, 2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_goals_user_id ON goals(user_id);

