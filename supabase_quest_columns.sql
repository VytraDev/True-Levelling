-- Run this in the Supabase SQL editor before using the updated quest system.
-- Adds description and difficulty columns to the quests table.

ALTER TABLE quests ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'easy';
ALTER TABLE quests ADD COLUMN IF NOT EXISTS stat_requirement text;
