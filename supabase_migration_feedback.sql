-- Feedback table for beta testers (run in Supabase → SQL Editor)
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('bug', 'suggestion', 'other')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'new'
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_insert_own_feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = player_id);

CREATE POLICY "users_can_view_own_feedback"
  ON feedback FOR SELECT
  WITH CHECK (auth.uid() = player_id);

CREATE INDEX IF NOT EXISTS idx_feedback_player ON feedback(player_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at DESC);
