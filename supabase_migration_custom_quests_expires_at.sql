-- Run this in Supabase SQL Editor.
-- Tiered expiration: easy/easy+ = 1 day, medium/medium+ = 3 days, hard/hard+/sjw = 5 days after completion (at next midnight).

ALTER TABLE custom_quests ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NULL;
