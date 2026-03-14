import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { usePlayerStore } from '../store/playerStore';
import { claimSpecialQuestReward } from '../lib/specialQuestEngine';
import { useToastStore } from '../store/toastStore';

interface SpecialQuestProgress {
  id: string;
  template_id: string;
  current_tier: number;
  current_progress: number;
  status: 'in_progress' | 'completed';
  reward_claimed?: boolean;
  special_quest_templates: {
    name: string;
    description?: string;
    tier: number;
    condition_value: number;
    reward_type: 'skill' | 'equipment' | 'item';
    reward_id: string;
  };
}

interface SpecialQuestsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SpecialQuestsModal({ visible, onClose }: SpecialQuestsModalProps) {
  const accentColor = usePlayerStore((s) => s.accentColor);
  const [specialQuests, setSpecialQuests] = useState<SpecialQuestProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const fetchSpecialQuests = async () => {
    const { data } = await supabase.auth.getSession();
    const authUserId = data?.session?.user?.id;
    if (!authUserId) return;

    setLoading(true);
    try {
      const { data: rows, error } = await supabase
        .from('player_special_quest_progress')
        .select(
          `
          id, template_id, current_tier, current_progress, status, reward_claimed,
          special_quest_templates (name, description, tier, condition_value, reward_type, reward_id)
        `
        )
        .eq('player_id', authUserId)
        .order('status', { ascending: false })
        .order('current_tier', { ascending: false });

      if (error) throw error;
      setSpecialQuests((rows as SpecialQuestProgress[]) ?? []);
    } catch (e) {
      console.error('Failed to fetch special quests:', e);
      useToastStore.getState().addToast('Failed to load special quests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchSpecialQuests();
    }
  }, [visible]);

  const handleClaimReward = async (item: SpecialQuestProgress) => {
    const t = item.special_quest_templates;
    if (!t || item.reward_claimed) return;

    const { data } = await supabase.auth.getSession();
    const authUserId = data?.session?.user?.id;
    if (!authUserId) return;

    const isComplete =
      item.status === 'completed' && item.current_progress >= t.condition_value;
    if (!isComplete) return;

    setClaimingId(item.id);
    try {
      await claimSpecialQuestReward(authUserId, item.id, t.reward_type, t.reward_id);
      await fetchSpecialQuests();
      useToastStore.getState().addToast(`✓ Reward Claimed: ${t.name}`);
    } catch (e) {
      console.error('Claim error:', e);
      useToastStore.getState().addToast('Failed to claim reward');
    } finally {
      setClaimingId(null);
    }
  };

  const renderQuestCard = ({ item }: { item: SpecialQuestProgress }) => {
    const template = item.special_quest_templates;
    const target = template.condition_value ?? 1;
    const progressPercent = target > 0 ? (item.current_progress / target) * 100 : 0;
    const isComplete =
      item.status === 'completed' && item.current_progress >= target;
    const isClaimed = !!item.reward_claimed;

    return (
      <View style={[styles.questCard, { borderColor: accentColor }]}>
        <View style={styles.questHeader}>
          <View>
            <Text style={[styles.questName, { color: accentColor }]}>{template.name}</Text>
            <Text style={styles.questTier}>Tier {template.tier}</Text>
          </View>
          {isClaimed && <Text style={styles.claimedBadge}>✓ CLAIMED</Text>}
        </View>

        {template.description ? (
          <Text style={styles.questDescription}>{template.description}</Text>
        ) : null}

        <View style={styles.progressSection}>
          <View style={[styles.progressBarBackground, { borderColor: accentColor }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(progressPercent, 100)}%`,
                  backgroundColor: isComplete ? '#10B981' : accentColor,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {item.current_progress}/{target}
          </Text>
        </View>

        <View style={styles.rewardSection}>
          <Text style={styles.rewardLabel}>Reward:</Text>
          <Text style={[styles.rewardValue, { color: accentColor }]}>
            {template.reward_type === 'skill' && '⚡ Skill'}
            {template.reward_type === 'equipment' && '🛡️ Equipment'}
            {template.reward_type === 'item' && '📦 Item'}
            {' - '}
            {template.reward_id}
          </Text>
        </View>

        {isComplete && !isClaimed && (
          <Pressable
            style={[styles.claimButton, { backgroundColor: accentColor }]}
            onPress={() => handleClaimReward(item)}
            disabled={claimingId === item.id}
          >
            <Text style={styles.claimButtonText}>
              {claimingId === item.id ? 'Claiming…' : 'CLAIM REWARD ✓'}
            </Text>
          </Pressable>
        )}

        {isComplete && isClaimed && (
          <View style={styles.claimedButton}>
            <Text style={styles.claimedButtonText}>REWARD CLAIMED</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.modalHeader, { borderBottomColor: accentColor }]}>
            <Text style={[styles.modalTitle, { color: accentColor }]}>SPECIAL QUESTS</Text>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <Text style={[styles.closeBtnText, { color: accentColor }]}>✕</Text>
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator color={accentColor} style={{ marginTop: 24 }} />
          ) : (
            <FlatList
              data={specialQuests}
              renderItem={renderQuestCard}
              keyExtractor={(item) => item.id}
              style={styles.questList}
              contentContainerStyle={specialQuests.length === 0 ? styles.emptyContainer : undefined}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No special quests yet</Text>
              }
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0F0F0F',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 8,
  },
  closeBtnText: {
    fontSize: 22,
  },
  questList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyContainer: {
    paddingTop: 40,
  },
  questCard: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  questName: {
    fontSize: 14,
    fontWeight: '600',
  },
  questTier: {
    fontSize: 11,
    color: '#737373',
    marginTop: 2,
  },
  claimedBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    backgroundColor: 'rgba(16,185,129,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  questDescription: {
    fontSize: 12,
    color: '#A3A3A3',
    marginBottom: 10,
    lineHeight: 16,
  },
  progressSection: {
    marginBottom: 10,
  },
  progressBarBackground: {
    height: 16,
    backgroundColor: '#0F0F0F',
    borderRadius: 4,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: '#737373',
    textAlign: 'right',
  },
  rewardSection: {
    marginBottom: 12,
  },
  rewardLabel: {
    fontSize: 11,
    color: '#737373',
    marginBottom: 4,
  },
  rewardValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  claimButton: {
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  claimButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  claimedButton: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  claimedButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  emptyText: {
    fontSize: 14,
    color: '#737373',
    textAlign: 'center',
  },
});
