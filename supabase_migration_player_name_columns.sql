-- Add player_name to tables for easier identification in Supabase (run in SQL Editor)
ALTER TABLE quests ADD COLUMN IF NOT EXISTS player_name TEXT;
ALTER TABLE custom_quests ADD COLUMN IF NOT EXISTS player_name TEXT;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS player_name TEXT;
ALTER TABLE habit_logs ADD COLUMN IF NOT EXISTS player_name TEXT;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS player_name TEXT;
