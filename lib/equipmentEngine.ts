import { supabase } from './supabase';
import { getPlayerNameByUserId } from './playerAPI';

export type EquipmentSlot =
  | 'helmet'
  | 'chest'
  | 'legs'
  | 'boots'
  | 'weapon'
  | 'accessory';

export interface EquipmentTemplate {
  id: string;
  name: string;
  description: string | null;
  slot: EquipmentSlot;
  image_url: string | null;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | null;
  bonus_str: number | null;
  bonus_agi: number | null;
  bonus_int: number | null;
  bonus_vit: number | null;
  bonus_end: number | null;
  level_requirement: number | null;
  created_at: string | null;
}

export interface EquippedGearRow {
  id: string;
  player_id: string;
  equipment_id: string;
  slot: EquipmentSlot;
  equipped_at: string | null;
  equipment_templates: EquipmentTemplate | null;
}

export interface GearInventoryRow {
  id: string;
  player_id: string;
  equipment_id: string;
  acquired_at: string | null;
  equipment_templates: EquipmentTemplate | null;
}

export async function getEquipmentTemplates(): Promise<EquipmentTemplate[]> {
  const { data, error } = await supabase.from('equipment_templates').select('*');
  if (error) throw error;
  return (data as EquipmentTemplate[] | null) ?? [];
}

export async function getEquippedGear(playerId: string): Promise<EquippedGearRow[]> {
  const { data, error } = await supabase
    .from('player_equipped_gear')
    .select('*, equipment_templates(*)')
    .eq('player_id', playerId);
  if (error) throw error;
  return (data as EquippedGearRow[] | null) ?? [];
}

export async function equipGear(
  playerId: string,
  equipmentId: string,
  slot: EquipmentSlot
): Promise<void> {
  const playerName = await getPlayerNameByUserId(playerId);
  const { error } = await supabase
    .from('player_equipped_gear')
    .upsert(
      {
        player_id: playerId,
        player_name: playerName,
        equipment_id: equipmentId,
        slot,
      },
      { onConflict: 'player_id,slot' }
    );
  if (error) throw error;
}

export async function unequipGear(playerId: string, slot: EquipmentSlot): Promise<void> {
  const { error } = await supabase
    .from('player_equipped_gear')
    .delete()
    .eq('player_id', playerId)
    .eq('slot', slot);
  if (error) throw error;
}

export async function getGearInventory(playerId: string): Promise<GearInventoryRow[]> {
  const { data, error } = await supabase
    .from('player_gear_inventory')
    .select('*, equipment_templates(*)')
    .eq('player_id', playerId)
    .order('acquired_at', { ascending: false });
  if (error) throw error;
  return (data as GearInventoryRow[] | null) ?? [];
}

export async function addGearToInventory(playerId: string, equipmentId: string): Promise<void> {
  const playerName = await getPlayerNameByUserId(playerId);
  const { error } = await supabase.from('player_gear_inventory').insert({
    player_id: playerId,
    player_name: playerName,
    equipment_id: equipmentId,
  });
  if (error) throw error;
}

export function calculateGearBonuses(equipped: EquippedGearRow[]) {
  return equipped.reduce(
    (bonus, row) => {
      const t = row.equipment_templates;
      return {
        str: bonus.str + (t?.bonus_str ?? 0),
        agi: bonus.agi + (t?.bonus_agi ?? 0),
        int: bonus.int + (t?.bonus_int ?? 0),
        vit: bonus.vit + (t?.bonus_vit ?? 0),
        end: bonus.end + (t?.bonus_end ?? 0),
      };
    },
    { str: 0, agi: 0, int: 0, vit: 0, end: 0 }
  );
}
