-- Run this in Supabase SQL Editor to add custom quest attempt limit columns to players table.
-- QA: 10 attempts per day, reset at midnight.

ALTER TABLE players ADD COLUMN IF NOT EXISTS custom_quest_attempts_today INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS custom_quest_attempts_reset_date TEXT DEFAULT NULL;
