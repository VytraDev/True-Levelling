import { supabase } from './supabase';
import { getPlayerNameByUserId } from './playerAPI';

export type ItemType = 'potion_hp' | 'potion_mp' | 'potion_sta' | 'dungeon_key';

export interface ItemTemplate {
  id: string;
  name: string;
  description: string | null;
  item_type: ItemType;
  image_url: string | null;
  rarity: 'common' | 'rare' | 'legendary' | null;
  value: number | null;
  usable_in_battle: boolean | null;
  max_stack: number | null;
  created_at: string | null;
}

export interface InventoryRow {
  id: string;
  player_id: string;
  item_id: string;
  quantity: number;
  acquired_at: string | null;
  item_templates: ItemTemplate | null;
}

export async function getItemTemplates(): Promise<ItemTemplate[]> {
  const { data, error } = await supabase.from('item_templates').select('*');
  if (error) throw error;
  return (data as ItemTemplate[] | null) ?? [];
}

export async function getInventory(playerId: string): Promise<InventoryRow[]> {
  const { data, error } = await supabase
    .from('player_inventory')
    .select('*, item_templates(*)')
    .eq('player_id', playerId)
    .order('acquired_at', { ascending: false });
  if (error) throw error;
  return (data as InventoryRow[] | null) ?? [];
}

export async function addItemToInventory(
  playerId: string,
  itemId: string,
  quantity = 1
): Promise<void> {
  const { data: existing } = await supabase
    .from('player_inventory')
    .select('quantity')
    .eq('player_id', playerId)
    .eq('item_id', itemId)
    .maybeSingle();

  const existingQty = (existing as { quantity?: number } | null)?.quantity;

  if (typeof existingQty === 'number') {
    const { error } = await supabase
      .from('player_inventory')
      .update({ quantity: existingQty + quantity })
      .eq('player_id', playerId)
      .eq('item_id', itemId);
    if (error) throw error;
    return;
  }

  const playerName = await getPlayerNameByUserId(playerId);
  const { error } = await supabase.from('player_inventory').insert({
    player_id: playerId,
    player_name: playerName,
    item_id: itemId,
    quantity,
  });
  if (error) throw error;
}

export async function removeItemFromInventory(
  playerId: string,
  itemId: string,
  quantity = 1
): Promise<void> {
  const { data: existing } = await supabase
    .from('player_inventory')
    .select('id, quantity')
    .eq('player_id', playerId)
    .eq('item_id', itemId)
    .maybeSingle();

  const row = existing as { id: string; quantity: number } | null;
  if (!row) return;

  if (row.quantity <= quantity) {
    const { error } = await supabase.from('player_inventory').delete().eq('id', row.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from('player_inventory')
    .update({ quantity: row.quantity - quantity })
    .eq('id', row.id);
  if (error) throw error;
}
