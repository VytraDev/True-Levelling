-- Special quest templates (run in Supabase → SQL Editor)
CREATE TABLE IF NOT EXISTS special_quest_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'level_milestone', 'quest_completion', 'custom_quest',
    'streak', 'stat_threshold', 'combat', 'combat_damage',
    'no_damage', 'equipment', 'gold'
  )),
  condition_type TEXT NOT NULL,
  tier INTEGER NOT NULL,
  condition_value INTEGER NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('skill', 'equipment', 'item')),
  reward_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_special_quest_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES special_quest_templates(id),
  current_tier INTEGER NOT NULL DEFAULT 1,
  current_progress INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  completed_at TIMESTAMP WITH TIME ZONE,
  reward_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE special_quest_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_special_quest_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates_readable_by_all"
  ON special_quest_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "players_can_view_own_progress"
  ON player_special_quest_progress FOR SELECT
  WITH CHECK (auth.uid() = player_id);

CREATE POLICY "players_can_insert_own_progress"
  ON player_special_quest_progress FOR INSERT
  WITH CHECK (auth.uid() = player_id);

CREATE POLICY "players_can_update_own_progress"
  ON player_special_quest_progress FOR UPDATE
  WITH CHECK (auth.uid() = player_id);

CREATE INDEX IF NOT EXISTS idx_special_quests_category ON special_quest_templates(category);
CREATE INDEX IF NOT EXISTS idx_special_quests_condition ON special_quest_templates(condition_type);
CREATE INDEX IF NOT EXISTS idx_player_progress_player ON player_special_quest_progress(player_id);
CREATE INDEX IF NOT EXISTS idx_player_progress_status ON player_special_quest_progress(status);

-- Seed initial templates
INSERT INTO special_quest_templates
(name, description, category, condition_type, tier, condition_value, reward_type, reward_id)
VALUES
('Novice Awakening', 'Reach Level 5', 'level_milestone', 'level_reach', 1, 5, 'skill', 'skill_slash'),
('Rising Power', 'Reach Level 10', 'level_milestone', 'level_reach', 2, 10, 'skill', 'skill_power_strike'),
('Legendary Strength', 'Reach Level 20', 'level_milestone', 'level_reach', 3, 20, 'equipment', 'gear_legendary_armor'),
('Dedication I', 'Complete 10 daily quests', 'quest_completion', 'quest_count', 1, 10, 'skill', 'skill_focus'),
('Dedication II', 'Complete 25 daily quests', 'quest_completion', 'quest_count', 2, 25, 'item', 'item_essence'),
('Master of Quests', 'Complete 50 daily quests', 'quest_completion', 'quest_count', 3, 50, 'equipment', 'gear_master_robes'),
('Consistent I', 'Maintain 5-day flawless streak', 'streak', 'streak_days', 1, 5, 'equipment', 'gear_determination_ring'),
('Consistent II', 'Maintain 15-day flawless streak', 'streak', 'streak_days', 2, 15, 'skill', 'skill_perseverance'),
('Battle Ready', 'Win 5 battles', 'combat', 'battle_wins', 1, 5, 'item', 'item_healing_potion'),
('Warrior', 'Win 20 battles', 'combat', 'battle_wins', 2, 20, 'skill', 'skill_war_cry'),
('Strength I', 'Reach 50 Strength', 'stat_threshold', 'stat_strength', 1, 50, 'equipment', 'gear_strength_bracers'),
('Agility I', 'Reach 50 Agility', 'stat_threshold', 'stat_agility', 1, 50, 'skill', 'skill_dash');
