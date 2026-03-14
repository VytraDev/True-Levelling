import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
  Animated,
} from 'react-native';

const isWeb = Platform.OS === 'web';

const today = new Date();
const dateString = today.toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

const SAMPLE_QUESTS = [
  { id: '1', name: '30 Push-ups', xp: 50 },
  { id: '2', name: 'Read 20 pages', xp: 50 },
  { id: '3', name: '10 min meditation', xp: 50 },
];

const XP_PER_QUEST = 50;
const MAX_DISPLAY_XP = 500;
const PENALTY_SEGMENTS = 5;

export default function App() {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const completedCount = Object.values(completed).filter(Boolean).length;
  const currentXP = completedCount * XP_PER_QUEST;
  const penaltyCount = SAMPLE_QUESTS.length - completedCount; // unchecked = red segments

  const xpProgressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const targetProgress = currentXP / MAX_DISPLAY_XP;
    Animated.timing(xpProgressAnim, {
      toValue: targetProgress,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [currentXP, xpProgressAnim]);

  const toggleQuest = (id: string) => {
    setCompleted((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <View style={[styles.outer, isWeb && styles.outerWeb]}>
      <View style={[styles.container, isWeb && styles.containerWeb]}>
        <StatusBar style="light" />
        <View style={styles.header}>
        <Text style={styles.title}>⚔️ ARISE</Text>
        <Text style={styles.subtitle}>The System Awaits, Hunter.</Text>
      </View>
      <View style={styles.dateCard}>
        <Text style={styles.dateText}>{dateString}</Text>
      </View>
      <View style={styles.xpSection}>
        <View style={styles.xpTrack}>
          <Animated.View
            style={[
              styles.xpFill,
              {
                width: xpProgressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.xpLabel}>
          {currentXP} / {MAX_DISPLAY_XP} XP
        </Text>
      </View>
      <View style={styles.statRow}>
        <Text style={styles.statText}>LEVEL 1</Text>
        <View style={styles.rankBadge}>
          <Text style={styles.rankBadgeText}>E-RANK</Text>
        </View>
        <Text style={styles.statText}>0 🪙</Text>
      </View>
      <View style={styles.questList}>
        {SAMPLE_QUESTS.map((quest) => (
          <Pressable
            key={quest.id}
            style={styles.questRow}
            onPress={() => toggleQuest(quest.id)}
          >
            <Text style={styles.checkbox}>
              {completed[quest.id] ? '✓' : '☐'}
            </Text>
            <Text
              style={[
                styles.questName,
                completed[quest.id] && styles.questNameCompleted,
              ]}
            >
              {quest.name}
            </Text>
            <View style={styles.xpBadge}>
              <Text style={styles.xpText}>+{quest.xp} XP</Text>
            </View>
          </Pressable>
        ))}
      </View>
      <View style={styles.penaltySection}>
        <Text style={styles.penaltyLabel}>PENALTY GAUGE</Text>
        <View style={styles.penaltyRow}>
          {Array.from({ length: PENALTY_SEGMENTS }, (_, i) => (
            <View
              key={i}
              style={[
                styles.penaltySegment,
                i < penaltyCount && styles.penaltySegmentFilled,
              ]}
            />
          ))}
        </View>
      </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  outerWeb: {
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  containerWeb: {
    maxWidth: 390,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#8B5CF6',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#E5E5E5',
  },
  dateCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  dateText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  xpSection: {
    marginBottom: 24,
  },
  xpTrack: {
    height: 10,
    backgroundColor: '#2A2A2A',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 5,
  },
  xpLabel: {
    fontSize: 13,
    color: '#A3A3A3',
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statText: {
    fontSize: 14,
    color: '#E5E5E5',
    fontWeight: '600',
  },
  rankBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rankBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  questList: {
    gap: 12,
    marginBottom: 24,
  },
  questRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
  },
  checkbox: {
    fontSize: 22,
    color: '#8B5CF6',
    marginRight: 14,
    width: 28,
    textAlign: 'center',
  },
  questName: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  questNameCompleted: {
    color: '#737373',
    textDecorationLine: 'line-through',
  },
  xpBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  xpText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  penaltySection: {
    marginTop: 8,
  },
  penaltyLabel: {
    fontSize: 11,
    color: '#737373',
    letterSpacing: 1.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  penaltyRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  penaltySegment: {
    width: 48,
    height: 32,
    backgroundColor: '#1A1A1A',
    borderRadius: 6,
  },
  penaltySegmentFilled: {
    backgroundColor: '#DC2626',
  },
});
