import { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import { DAILY_QUEST_POOL, CATEGORY_CONFIG, findQuestConfigByName } from '../lib/questConfig';

const OVERLAY_OPACITY = 0.85;
const AUTO_DISMISS_MS = 6000;

const STAT_TO_CATEGORY: Record<string, string> = {
  str: 'strength',
  agi: 'dexterity',
  int: 'intelligence',
  endurance: 'vigour',
  vit: 'health',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#16A34A',
  medium: '#D97706',
  hard: '#DC2626',
};

export interface ThresholdAlert {
  stat: string;
  value: number;
  message: string;
  quests: string[];
}

interface ThresholdModalProps {
  visible: boolean;
  alert: ThresholdAlert | null;
  onDismiss: () => void;
}

function getQuestRewards(name: string): { baseXP: number; baseGold: number; baseDifficulty: string } | null {
  for (const pool of Object.values(DAILY_QUEST_POOL)) {
    const found = pool.find((q) => q.name === name);
    if (found) return { baseXP: found.baseXP, baseGold: found.baseGold, baseDifficulty: found.baseDifficulty };
  }
  return null;
}

export function ThresholdModal({ visible, alert, onDismiss }: ThresholdModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && alert) {
      scaleAnim.setValue(0.7);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, alert, scaleAnim, opacityAnim]);

  useEffect(() => {
    if (!visible || !alert) return;
    const t = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [visible, alert, onDismiss]);

  if (!alert) return null;

  const categoryKey = STAT_TO_CATEGORY[alert.stat];
  const categoryConfig = categoryKey ? CATEGORY_CONFIG[categoryKey as keyof typeof CATEGORY_CONFIG] : null;
  const statColor = categoryConfig?.color ?? '#8B5CF6';
  const statLabel = categoryConfig?.label ?? alert.stat.toUpperCase();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Text style={styles.title}>NEW QUESTS UNLOCKED</Text>
          <Text style={[styles.statLabel, { color: statColor }]}>{statLabel} {alert.value}</Text>
          <Text style={styles.message}>{alert.message}</Text>
          <ScrollView style={styles.questScroll} showsVerticalScrollIndicator={false}>
            {alert.quests.map((questName) => {
              const rewards = getQuestRewards(questName);
              const config = findQuestConfigByName(questName);
              const difficulty = config?.baseDifficulty ?? rewards?.baseDifficulty ?? 'easy';
              const diffColor = DIFFICULTY_COLORS[difficulty] ?? DIFFICULTY_COLORS.easy;
              const baseXP = rewards?.baseXP ?? 0;
              const baseGold = rewards?.baseGold ?? 0;
              return (
                <View key={questName} style={styles.questRow}>
                  <Text style={styles.questName}>{questName}</Text>
                  <View style={styles.questMeta}>
                    <View style={[styles.difficultyBadge, { backgroundColor: diffColor }]}>
                      <Text style={styles.difficultyText}>{difficulty.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.rewardText}>+{baseXP} XP · +{baseGold} 🪙</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
          <Pressable
            style={styles.continueButton}
            onPress={onDismiss}
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: `rgba(0,0,0,${OVERLAY_OPACITY})`,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
    maxHeight: '80%',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F59E0B',
    marginBottom: 12,
    letterSpacing: 1,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  message: {
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  questScroll: {
    maxHeight: 220,
    width: '100%',
    marginBottom: 20,
  },
  questRow: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  questName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  questMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  difficultyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  rewardText: {
    fontSize: 13,
    color: '#A3A3A3',
  },
  continueButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 160,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
