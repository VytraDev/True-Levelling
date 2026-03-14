import { supabase } from './supabase';
import { getPlayerNameByUserId } from './playerAPI';

export type AbilityType = 'skill' | 'spell';

export interface Ability {
  id: string;
  name: string;
  description: string | null;
  ability_type: AbilityType;
  image_url: string | null;
  base_attack_coeff: number;
  stamina_cost: number;
  mana_cost: number;
  class_id: string | null;
  unlock_level: number;
}

export interface EquippedAbilityRow {
  id: string;
  player_id: string;
  ability_id: string;
  ability_type: AbilityType;
  slot: number;
  equipped_at: string | null;
  ability_templates: Ability | null;
}

export async function getAbilityTemplates(type?: AbilityType): Promise<Ability[]> {
  let q = supabase.from('ability_templates').select('*');
  if (type) q = q.eq('ability_type', type);
  const { data, error } = await q.order('unlock_level', { ascending: true });
  if (error) throw error;
  return (data as Ability[] | null) ?? [];
}

export async function learnAbility(playerId: string, abilityId: string): Promise<void> {
  const playerName = await getPlayerNameByUserId(playerId);
  const { error } = await supabase.from('player_learned_abilities').insert({
    player_id: playerId,
    player_name: playerName,
    ability_id: abilityId,
  });
  if (error) throw error;
}

export async function getLearnedAbilities(
  playerId: string,
  type?: AbilityType
): Promise<Ability[]> {
  // Relationship name depends on Supabase FK setup; this works with standard FK join.
  let query = supabase
    .from('player_learned_abilities')
    .select('ability_templates(*)')
    .eq('player_id', playerId);

  if (type) {
    query = query.eq('ability_templates.ability_type', type);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data as Array<{ ability_templates: Ability | null }> | null) ?? [];
  return rows.map((d) => d.ability_templates).filter(Boolean) as Ability[];
}

export async function getEquippedAbilities(
  playerId: string,
  type: AbilityType
): Promise<EquippedAbilityRow[]> {
  const { data, error } = await supabase
    .from('player_equipped_abilities')
    .select('*, ability_templates(*)')
    .eq('player_id', playerId)
    .eq('ability_type', type)
    .order('slot', { ascending: true });

  if (error) throw error;
  return (data as EquippedAbilityRow[] | null) ?? [];
}

export async function equipAbility(
  playerId: string,
  abilityId: string,
  type: AbilityType,
  slot: number
): Promise<void> {
  const playerName = await getPlayerNameByUserId(playerId);
  // Prevent duplicates: remove the same ability if it's already equipped elsewhere.
  await supabase
    .from('player_equipped_abilities')
    .delete()
    .eq('player_id', playerId)
    .eq('ability_id', abilityId)
    .eq('ability_type', type);

  const { error } = await supabase
    .from('player_equipped_abilities')
    .upsert(
      {
        player_id: playerId,
        player_name: playerName,
        ability_id: abilityId,
        ability_type: type,
        slot,
      },
      { onConflict: 'player_id,ability_type,slot' }
    );

  if (error) throw error;
}

export async function unequipAbility(
  playerId: string,
  slot: number,
  type: AbilityType
): Promise<void> {
  const { error } = await supabase
    .from('player_equipped_abilities')
    .delete()
    .eq('player_id', playerId)
    .eq('slot', slot)
    .eq('ability_type', type);

  if (error) throw error;
}
