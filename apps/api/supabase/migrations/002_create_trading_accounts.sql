-- ============================================================
-- 002_create_trading_accounts.sql
-- ============================================================

CREATE TYPE account_type AS ENUM ('LIVE', 'DEMO', 'PROP');

CREATE TABLE trading_accounts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  broker          TEXT,
  currency        CHAR(3) NOT NULL DEFAULT 'USD',
  type            account_type NOT NULL DEFAULT 'LIVE',
  initial_balance NUMERIC(15, 2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trading_accounts_user_id ON trading_accounts(user_id);

