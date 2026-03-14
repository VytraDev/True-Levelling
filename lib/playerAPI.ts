import { supabase } from './supabase';

/**
 * Get player display name by auth user id (for inserts that use auth.uid()).
 * Use when you have session.user.id.
 */
export async function getPlayerNameByUserId(authUserId: string): Promise<string> {
  const { data } = await supabase
    .from('players')
    .select('name')
    .eq('user_id', authUserId)
    .maybeSingle();
  return (data as { name?: string } | null)?.name ?? 'Unknown';
}

/**
 * Get player display name by player row id (players.id).
 * Use when you have usePlayerStore id (e.g. for quests).
 */
export async function getPlayerNameByPlayerId(playerId: string): Promise<string> {
  const { data } = await supabase
    .from('players')
    .select('name')
    .eq('id', playerId)
    .maybeSingle();
  return (data as { name?: string } | null)?.name ?? 'Unknown';
}
