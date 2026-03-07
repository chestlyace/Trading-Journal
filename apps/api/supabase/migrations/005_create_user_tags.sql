-- ============================================================
-- 005_create_user_tags.sql
-- ============================================================

CREATE TABLE user_tags (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag_type   tag_type NOT NULL,
  tag_value  TEXT NOT NULL,
  color      CHAR(7),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, tag_type, tag_value)
);

CREATE INDEX idx_user_tags_user_id ON user_tags(user_id);

