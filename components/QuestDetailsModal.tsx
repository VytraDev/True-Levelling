import React, { useEffect, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { findQuestConfigByName } from '../lib/questConfig';
import { CLASS_CONFIG } from '../lib/classEngine';

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#16A34A',
  'easy+': '#2563EB',
  medium: '#D97706',
  'medium+': '#EA580C',
  hard: '#DC2626',
  'hard+': '#9F1239',
  sjw: '#7C3AED',
};

type StatKey = 'str' | 'agi' | 'int' | 'vit' | 'endurance';

export type QuestForDetails = {
  id: string;
  name: string;
  category: string;
  xp_reward: number;
  gold_reward: number;
  completed_at: string | null;
  description?: string | null;
  difficulty?: string | null;
  isCustom?: boolean;
  deadline_date?: string;
  deadline_time?: string;
};

interface QuestDetailsModalProps {
  visible: boolean;
  quest: QuestForDetails | null;
  accentColor: string;
  playerClass: keyof typeof CLASS_CONFIG;
  onClose: () => void;
  onDelete?: (questId: string) => void;
}

/** Format ISO date (YYYY-MM-DD) to DD-MM-YYYY */
function formatDeadlineDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return [d, m, y].join('-');
}

function getTimeRemaining(deadlineDate: string, deadlineTime: string): string {
  const [hours, mins] = deadlineTime.split(':').map(Number);
  const end = new Date(deadlineDate);
  end.setHours(hours ?? 23, mins ?? 59, 0, 0);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  if (diff <= 0) return 'Past deadline';
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h ${m}m remaining`;
  if (h > 0) return `${h}h ${m}m remaining`;
  return `${m}m remaining`;
}

export function QuestDetailsModal({
  visible,
  quest,
  accentColor,
  playerClass,
  onClose,
  onDelete,
}: QuestDetailsModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (visible && quest) {
      console.log('=== QUEST MODAL OPENED ===');
      try {
        console.log('Modal received quest:', JSON.stringify(quest, null, 2));
      } catch {
        console.log('Modal received quest (non-serializable):', quest);
      }
      const isHabit = !!(quest as any).habit_type;
      const isQuest =
        !!(quest as any).quest_type ||
        !!(quest as any).is_daily ||
        !!(quest as any).isCustom ||
        !!((quest as any).category && !isHabit);
      console.log('Quest structure:', {
        hasName: !!quest.name,
        hasDescription: !!quest.description,
        type: isHabit ? 'HABIT' : isQuest ? 'QUEST' : 'UNKNOWN',
        allFields: Object.keys(quest),
      });
    }
  }, [visible, quest]);

  if (!quest) return null;

  const configQuest = findQuestConfigByName(quest.name);
  // Prefer config description; fall back to quest.description so daily quests always show text.
  const displayDescription =
    (configQuest?.description ?? quest.description ?? '').trim() || null;
  const displayDifficulty = (configQuest?.baseDifficulty ?? quest.difficulty ?? 'easy').toLowerCase();
  const difficultyColor = DIFFICULTY_COLORS[displayDifficulty] ?? DIFFICULTY_COLORS.easy;
  const statReq = configQuest?.statReq;
  const statKey = statReq ? (Object.keys(statReq)[0] as StatKey | undefined) : undefined;
  const statVal = statReq && statKey ? statReq[statKey] : undefined;
  const reqText =
    quest.category === 'class'
      ? 'Class quest'
      : statKey && statVal !== undefined && statVal > 0
        ? `Requires ${statKey.toUpperCase()} ${statVal}+`
        : 'No requirement';

  const isCustom = quest.isCustom === true;
  const canDelete = isCustom && !quest.completed_at && onDelete;
  const showDeleteConfirm = canDelete && confirmDelete;

  const handleClose = () => {
    setConfirmDelete(false);
    onClose();
  };

  const handleDeleteConfirm = async () => {
    if (quest && onDelete) {
      const result = onDelete(quest.id) as any;
      if (typeof result?.then === 'function') {
        await result;
      }
      setConfirmDelete(false);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.box} onPress={(e) => e.stopPropagation()}>
          <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
            <View style={styles.header}>
              <Text style={styles.title}>{quest.name}</Text>
              <Pressable onPress={handleClose} hitSlop={8}>
                <Text style={styles.closeBtn}>✕</Text>
              </Pressable>
            </View>

            {displayDescription ? (
              <View style={styles.descriptionBlock}>
                <Text style={styles.descriptionLabel}>Description</Text>
                <Text style={styles.bodyDescription} selectable>
                  {displayDescription}
                </Text>
              </View>
            ) : null}

            <View style={styles.rewardRow}>
              <Text style={[styles.rewardXp, { color: '#8B5CF6' }]}>+{quest.xp_reward} XP</Text>
              <Text style={[styles.rewardGold, { color: '#F59E0B' }]}>+{quest.gold_reward} gold</Text>
            </View>

            <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor }]}>
              <Text style={styles.difficultyBadgeText}>{(configQuest?.baseDifficulty ?? quest.difficulty ?? 'easy').toUpperCase()}</Text>
            </View>

            {quest.category !== 'class' && (
              <Text style={styles.statReqText}>{reqText}</Text>
            )}

            {quest.category === 'class' && (
              <Text style={styles.penaltyNote}>Penalty does not apply</Text>
            )}

            {isCustom && quest.deadline_date && (
              <>
                <Text style={styles.deadlineLabel}>
                  Deadline: {formatDeadlineDate(quest.deadline_date)} {quest.deadline_time ?? '23:59'}
                </Text>
                <Text style={styles.timeRemaining}>
                  {getTimeRemaining(quest.deadline_date, quest.deadline_time ?? '23:59')}
                </Text>
              </>
            )}

            {canDelete && !showDeleteConfirm && (
              <Pressable
                style={styles.deleteButton}
                onPress={() => setConfirmDelete(true)}
              >
                <Text style={styles.deleteButtonText}>Delete quest</Text>
              </Pressable>
            )}

            {showDeleteConfirm && (
              <View style={styles.deleteConfirmBox}>
                <Text style={styles.deleteConfirmText}>
                  Delete '{quest.name}'? This cannot be undone.
                </Text>
                <View style={styles.deleteConfirmButtons}>
                  <Pressable style={styles.deleteCancelBtn} onPress={() => setConfirmDelete(false)}>
                    <Text style={styles.deleteCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable style={styles.deleteConfirmBtn} onPress={handleDeleteConfirm}>
                    <Text style={styles.deleteConfirmBtnText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            )}

            <Pressable style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  box: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  scroll: {},
  content: { padding: 20, paddingBottom: 32 },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 12,
  },
  closeBtn: { fontSize: 22, color: '#737373' },
  systemDescription: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#737373',
    marginBottom: 12,
  },
  descriptionBlock: {
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rewardRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  rewardXp: { fontSize: 14, fontWeight: '600' },
  rewardGold: { fontSize: 14, fontWeight: '600' },
  bodyDescription: {
    fontSize: Platform.OS === 'android' ? 15 : 14,
    color: '#E5E7EB',
    lineHeight: 22,
    marginBottom: 0,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  difficultyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  statReqText: { fontSize: 12, color: '#737373', marginBottom: 8 },
  penaltyNote: { fontSize: 12, color: '#737373', fontStyle: 'italic', marginBottom: 12 },
  deadlineLabel: { fontSize: 13, color: '#A3A3A3', marginBottom: 4 },
  timeRemaining: { fontSize: 12, color: '#D97706', marginBottom: 16 },
  deleteButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#7F1D1D',
    borderRadius: 8,
    marginBottom: 16,
  },
  deleteButtonText: { fontSize: 14, fontWeight: '600', color: '#FCA5A5' },
  deleteConfirmBox: {
    backgroundColor: '#2A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#7F1D1D',
  },
  deleteConfirmText: {
    fontSize: 14,
    color: '#E5E5E5',
    marginBottom: 12,
  },
  deleteConfirmButtons: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  deleteCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  deleteCancelText: { fontSize: 14, color: '#D1D5DB' },
  deleteConfirmBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#DC2626',
  },
  deleteConfirmBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  closeButton: {
    backgroundColor: '#2A2A2A',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
});
