-- ============================================================
-- 016_create_trade_voice_notes.sql
-- ============================================================

CREATE TABLE trade_voice_notes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id         UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_key      TEXT NOT NULL,
  file_name        TEXT,
  file_size        INTEGER,
  mime_type        TEXT,
  duration_seconds INTEGER,
  transcription    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trade_voice_notes_trade_id ON trade_voice_notes(trade_id);
CREATE INDEX idx_trade_voice_notes_user_id ON trade_voice_notes(user_id);

-- Enable RLS
ALTER TABLE trade_voice_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trade_voice_notes table
CREATE POLICY "Users can view their own trade voice notes"
  ON trade_voice_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trade voice notes"
  ON trade_voice_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trade voice notes"
  ON trade_voice_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trade voice notes"
  ON trade_voice_notes FOR DELETE
  USING (auth.uid() = user_id);

-- Create the storage bucket for trade voice notes
INSERT INTO storage.buckets (id, name, public)
VALUES ('trade_voice_notes', 'trade_voice_notes', false)
ON CONFLICT (id) DO NOTHING;

-- Set up access controls for the bucket
CREATE POLICY "Public Access to voice notes"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'trade_voice_notes' );

CREATE POLICY "Users can upload their own trade voice notes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'trade_voice_notes' AND
    (auth.uid() = owner)
);

CREATE POLICY "Users can update their own trade voice notes"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'trade_voice_notes' AND
    (auth.uid() = owner)
);

CREATE POLICY "Users can delete their own trade voice notes"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'trade_voice_notes' AND
    (auth.uid() = owner)
);
