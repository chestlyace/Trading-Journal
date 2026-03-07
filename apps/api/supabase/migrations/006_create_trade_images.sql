-- ============================================================
-- 006_create_trade_images.sql
-- ============================================================

CREATE TABLE trade_images (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id    UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL,
  file_name   TEXT,
  file_size   INTEGER,
  mime_type   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trade_images_trade_id ON trade_images(trade_id);

