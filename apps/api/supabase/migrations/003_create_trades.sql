-- ============================================================
-- 003_create_trades.sql
-- ============================================================

CREATE TYPE direction_type AS ENUM ('LONG', 'SHORT');

CREATE TYPE asset_class_type AS ENUM (
  'FOREX', 'STOCKS', 'CRYPTO', 'FUTURES', 'INDICES', 'COMMODITIES'
);

CREATE TYPE trade_outcome_type AS ENUM (
  'WIN', 'LOSS', 'BREAK_EVEN', 'PARTIAL'
);

CREATE TYPE session_type AS ENUM (
  'LONDON', 'NEW_YORK', 'ASIAN', 'LONDON_NY_OVERLAP', 'OTHER'
);

CREATE TYPE emotional_state_type AS ENUM (
  'CALM', 'ANXIOUS', 'GREEDY', 'FEARFUL', 'CONFIDENT', 'FOMO', 'NEUTRAL'
);

CREATE TABLE trades (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id       UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,

  -- Instrument
  instrument       TEXT NOT NULL,
  asset_class      asset_class_type NOT NULL,
  direction        direction_type NOT NULL,

  -- Timing
  entry_time       TIMESTAMPTZ NOT NULL,
  exit_time        TIMESTAMPTZ,

  -- Pricing
  entry_price      NUMERIC(20, 8) NOT NULL,
  exit_price       NUMERIC(20, 8),

  -- Position
  position_size    NUMERIC(20, 8) NOT NULL,
  stop_loss        NUMERIC(20, 8),
  take_profit      NUMERIC(20, 8),

  -- P&L (stored as account currency equivalent)
  gross_pnl        NUMERIC(15, 4),
  fees             NUMERIC(15, 4) NOT NULL DEFAULT 0,
  net_pnl          NUMERIC(15, 4),
  risk_amount      NUMERIC(15, 4),

  -- Calculated metrics
  rr_ratio         NUMERIC(8, 4),
  trade_duration_minutes INTEGER,

  -- Classification
  outcome          trade_outcome_type,
  session          session_type,
  emotional_state  emotional_state_type,

  -- Review
  trade_rating     SMALLINT CHECK (trade_rating BETWEEN 1 AND 5),
  notes            TEXT,

  -- Status
  is_open          BOOLEAN NOT NULL DEFAULT FALSE,
  is_draft         BOOLEAN NOT NULL DEFAULT FALSE,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_account_id ON trades(account_id);
CREATE INDEX idx_trades_entry_time ON trades(entry_time DESC);
CREATE INDEX idx_trades_instrument ON trades(instrument);
CREATE INDEX idx_trades_outcome ON trades(outcome);
CREATE INDEX idx_trades_asset_class ON trades(asset_class);
CREATE INDEX idx_trades_user_entry_time ON trades(user_id, entry_time DESC);

CREATE INDEX idx_trades_notes_fts
  ON trades
  USING gin(to_tsvector('english', COALESCE(notes, '')));

CREATE INDEX idx_trades_instrument_trgm
  ON trades
  USING gin(instrument gin_trgm_ops);

