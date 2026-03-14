-- Run this in Supabase SQL Editor to add per-habit check counter.
-- Optionally backfill from habit_logs: UPDATE habits h SET check_count = (SELECT COUNT(*) FROM habit_logs WHERE habit_id = h.id);

ALTER TABLE habits ADD COLUMN IF NOT EXISTS check_count INTEGER DEFAULT 0;
