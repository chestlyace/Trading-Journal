-- ============================================================
-- 004_create_trade_tags.sql
-- ============================================================

CREATE TYPE tag_type AS ENUM ('STRATEGY', 'MISTAKE');

CREATE TABLE trade_tags (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id   UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag_type   tag_type NOT NULL,
  tag_value  TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(trade_id, tag_type, tag_value)
);

CREATE INDEX idx_trade_tags_trade_id ON trade_tags(trade_id);
CREATE INDEX idx_trade_tags_user_tag ON trade_tags(user_id, tag_value);

