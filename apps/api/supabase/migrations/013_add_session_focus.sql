-- ============================================================
-- 013_add_session_focus.sql
-- ============================================================

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS session_focus TEXT[];
