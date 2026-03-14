import { supabase } from './supabase';
import { useToastStore } from '../store/toastStore';
import { getPlayerNameByUserId } from './playerAPI';

interface SpecialQuestTemplate {
  id: string;
  name: string;
  condition_type: string;
  tier: number;
  condition_value: number;
  reward_type: string;
  reward_id: string;
}

export async function claimSpecialQuestReward(
  playerId: string,
  progressId: string,
  rewardType: string,
  rewardId: string
): Promise<{ success: boolean }> {
  try {
    await supabase
      .from('player_special_quest_progress')
      .update({ reward_claimed: true })
      .eq('id', progressId)
      .eq('player_id', playerId);

    if (rewardType === 'skill') {
      console.log('Award skill:', rewardId);
      useToastStore.getState().addToast(`✓ Skill Unlocked: ${rewardId}`);
    } else if (rewardType === 'equipment') {
      console.log('Award equipment:', rewardId);
      useToastStore.getState().addToast(`✓ Equipment Acquired: ${rewardId}`);
    } else if (rewardType === 'item') {
      console.log('Award item:', rewardId);
      useToastStore.getState().addToast(`✓ Item Obtained: ${rewardId}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Claim error:', error);
    throw error;
  }
}

export async function checkAndUpdateSpecialQuests(
  playerId: string,
  conditionType: string,
  value: number
): Promise<void> {
  try {
    const { data: templates } = await supabase
      .from('special_quest_templates')
      .select('*')
      .eq('condition_type', conditionType)
      .order('tier', { ascending: true });

    if (!templates || templates.length === 0) return;

    const { data: progresses } = await supabase
      .from('player_special_quest_progress')
      .select('*')
      .eq('player_id', playerId)
      .in('template_id', templates.map((t) => t.id));

    const completedIds = new Set(
      (progresses ?? []).filter((p: { status: string }) => p.status === 'completed').map((p: { template_id: string }) => p.template_id)
    );

    const playerName = await getPlayerNameByUserId(playerId);

    for (const template of templates as SpecialQuestTemplate[]) {
      if (completedIds.has(template.id)) continue;

      const progress = (progresses ?? []).find(
        (p: { template_id: string }) => p.template_id === template.id
      );

      if (value < template.condition_value) {
        if (!progress) {
          await supabase.from('player_special_quest_progress').insert({
            player_id: playerId,
            player_name: playerName,
            template_id: template.id,
            current_tier: template.tier,
            current_progress: value,
            status: 'in_progress',
            reward_claimed: false,
          });
        } else {
          await supabase
            .from('player_special_quest_progress')
            .update({ current_progress: value })
            .eq('id', progress.id);
        }
        continue;
      }

      await awardReward(playerId, template.reward_type, template.reward_id);
      if (progress) {
        await supabase
          .from('player_special_quest_progress')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            reward_claimed: true,
            current_progress: template.condition_value,
          })
          .eq('id', progress.id);
      } else {
        await supabase.from('player_special_quest_progress').insert({
          player_id: playerId,
          player_name: playerName,
          template_id: template.id,
          current_tier: template.tier,
          current_progress: template.condition_value,
          status: 'completed',
          completed_at: new Date().toISOString(),
          reward_claimed: true,
        });
      }
      useToastStore.getState().addToast(`✓ Special Quest: ${template.name}`);
      completedIds.add(template.id);
    }
  } catch (error) {
    console.error('Special quest check error:', error);
  }
}

export async function initializeSpecialQuests(
  playerId: string,
  playerName: string
): Promise<void> {
  try {
    const { data: existing } = await supabase
      .from('player_special_quest_progress')
      .select('id')
      .eq('player_id', playerId)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log('Special quests already initialized for player:', playerId);
      return;
    }

    const { data: templates, error } = await supabase
      .from('special_quest_templates')
      .select('id, tier');

    if (error) throw error;
    if (!templates || templates.length === 0) return;

    const rows = templates.map((t: { id: string; tier: number }) => ({
      player_id: playerId,
      player_name: playerName,
      template_id: t.id,
      current_tier: t.tier ?? 1,
      current_progress: 0,
      status: 'in_progress',
      reward_claimed: false,
    }));

    const { error: insertError } = await supabase
      .from('player_special_quest_progress')
      .insert(rows);

    if (insertError) throw insertError;
    console.log('Initialized special quests for player:', playerId);
  } catch (e) {
    console.error('initializeSpecialQuests error:', e);
  }
}

async function awardReward(
  _playerId: string,
  type: string,
  rewardId: string
): Promise<void> {
  if (type === 'skill') {
    console.log('Award skill:', rewardId);
  } else if (type === 'equipment') {
    console.log('Award equipment:', rewardId);
  } else if (type === 'item') {
    console.log('Award item:', rewardId);
  }
}
