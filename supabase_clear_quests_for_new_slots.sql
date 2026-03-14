-- Run once in Supabase SQL editor after deploying the new fixed + random slot system
-- so that the next daily load generates fresh quests with the new logic.

DELETE FROM quests;
