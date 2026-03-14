import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { HabitDetailsModal } from './HabitDetailsModal';
import { usePlayerStore, HABIT_REWARD_PER_LEVEL } from '../store/playerStore';
import { useToastStore } from '../store/toastStore';
import { supabase } from '../lib/supabase';
import { getPlayerNameByUserId } from '../lib/playerAPI';

interface Habit {
  id: string;
  name: string;
  description: string;
  habit_type: 'good' | 'bad';
  category: string;
  last_logged_at: string | null;
  /** Total number of times this habit has been logged (+ or −). */
  check_count?: number;
}

interface HabitsCardProps {
  habits: Habit[];
  onHabitLogged: () => void;
  onHabitDeleted: (habitId: string) => void;
  onAddHabitPress?: () => void;
}

export function HabitsCard({ habits, onHabitLogged, onHabitDeleted, onAddHabitPress }: HabitsCardProps) {
  const [detailsHabit, setDetailsHabit] = useState<Habit | null>(null);
  const [pendingDeleteHabit, setPendingDeleteHabit] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const playerLevel = usePlayerStore((s) => s.level);
  const addXP = usePlayerStore((s) => s.addXP);
  const increasePenalty = usePlayerStore((s) => s.increasePenalty);

  const habitsByCategory = habits.reduce(
    (acc, habit) => {
      const key = habit.category.toLowerCase();
      if (!acc[key]) acc[key] = [];
      acc[key].push(habit);
      return acc;
    },
    {} as Record<string, Habit[]>
  );

  const handlePlus = async (habit: Habit) => {
    const today = new Date().toISOString().slice(0, 10);
    const { data: sessionData } = await supabase.auth.getSession();
    const authUserId = sessionData?.session?.user?.id;
    if (!authUserId) {
      Alert.alert('Not signed in', 'Please log in again.');
      return;
    }
    if (habit.habit_type === 'good') {
      if (habit.last_logged_at && habit.last_logged_at.slice(0, 10) === today) {
        Alert.alert('Already logged', 'You can only log this good habit once per day.');
        return;
      }
      const reward = playerLevel * HABIT_REWARD_PER_LEVEL;
      addXP(reward);
      const playerName = await getPlayerNameByUserId(authUserId);
      await supabase.from('habit_logs').insert([{ habit_id: habit.id, player_id: authUserId, player_name: playerName, logged_date: today }]);
      const newCheckCount = (habit.check_count ?? 0) + 1;
      await supabase
        .from('habits')
        .update({ last_logged_at: new Date().toISOString(), check_count: newCheckCount })
        .eq('id', habit.id);
      console.log('[HABITS] Incremented check_count for', habit.name, ', now:', newCheckCount);
      const removeXP = usePlayerStore.getState().removeXP;
      useToastStore.getState().addToastWithUndo(`✓ +${reward} XP`, async () => {
        await supabase.from('habit_logs').delete().eq('habit_id', habit.id).eq('player_id', authUserId).eq('logged_date', today);
        await supabase
          .from('habits')
          .update({ last_logged_at: null, check_count: Math.max(0, (habit.check_count ?? 0)) })
          .eq('id', habit.id);
        removeXP(reward);
        onHabitLogged();
      });
      onHabitLogged();
    }
  };

  const handleMinus = async (habit: Habit) => {
    const today = new Date().toISOString().slice(0, 10);
    const { data: sessionData } = await supabase.auth.getSession();
    const authUserId = sessionData?.session?.user?.id;
    if (!authUserId) {
      Alert.alert('Not signed in', 'Please log in again.');
      return;
    }
    if (habit.habit_type === 'bad') {
      increasePenalty();
      const playerName = await getPlayerNameByUserId(authUserId);
      await supabase.from('habit_logs').insert([{ habit_id: habit.id, player_id: authUserId, player_name: playerName, logged_date: today }]);
      const newCheckCount = (habit.check_count ?? 0) + 1;
      await supabase
        .from('habits')
        .update({ check_count: newCheckCount })
        .eq('id', habit.id);
      console.log('[HABITS] Incremented check_count for', habit.name, ', now:', newCheckCount);
      const currentPenalty = usePlayerStore.getState().penaltyGauge;
      useToastStore.getState().addToastWithUndo('Penalty: +1', async () => {
        await supabase.from('habit_logs').delete().eq('habit_id', habit.id).eq('player_id', authUserId).eq('logged_date', today);
        await supabase
          .from('habits')
          .update({ check_count: Math.max(0, (habit.check_count ?? 0)) })
          .eq('id', habit.id);
        usePlayerStore.getState().setPenaltyGauge(Math.max(0, currentPenalty - 1));
        onHabitLogged();
      });
      onHabitLogged();
    }
  };

  const handleDeleteHabit = (habitId: string, habitName: string) => {
    console.log('Delete habit clicked:', habitId, habitName);
    setDetailsHabit(null);
    // Alert.alert doesn't show on web; use custom confirmation modal
    if (Platform.OS !== 'web') {
      Alert.alert(
        'Delete Habit?',
        `Permanently delete "${habitName}"?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => {} },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => performDeleteHabit(habitId),
          },
        ]
      );
    } else {
      setPendingDeleteHabit({ id: habitId, name: habitName });
    }
  };

  const performDeleteHabit = async (habitId: string) => {
    setDeleting(true);
    try {
      const { error } = await supabase.from('habits').delete().eq('id', habitId);
      if (error) throw error;
      onHabitDeleted(habitId);
      useToastStore.getState().addToast('✓ Habit deleted');
    } catch (err) {
      console.error('Delete habit error:', err);
      useToastStore.getState().addToast('Failed to delete habit');
    } finally {
      setDeleting(false);
      setPendingDeleteHabit(null);
    }
  };

  const handleConfirmDelete = () => {
    if (!pendingDeleteHabit) return;
    performDeleteHabit(pendingDeleteHabit.id);
  };

  return (
    <View style={styles.container}>
      <HabitDetailsModal
        visible={detailsHabit !== null}
        habit={detailsHabit}
        onClose={() => setDetailsHabit(null)}
        onDelete={handleDeleteHabit}
      />

      {/* Delete confirmation modal (used on web where Alert.alert doesn't show) */}
      <Modal visible={pendingDeleteHabit !== null} transparent animationType="fade">
        <Pressable style={styles.confirmOverlay} onPress={() => !deleting && setPendingDeleteHabit(null)}>
          <Pressable style={styles.confirmBox} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.confirmTitle}>Delete Habit?</Text>
            <Text style={styles.confirmMessage}>
              Permanently delete "{pendingDeleteHabit?.name}"?
            </Text>
            <View style={styles.confirmButtons}>
              <Pressable
                style={styles.confirmCancelBtn}
                onPress={() => setPendingDeleteHabit(null)}
                disabled={deleting}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.confirmDeleteBtn}
                onPress={handleConfirmDelete}
                disabled={deleting}
              >
                <Text style={styles.confirmDeleteText}>{deleting ? 'Deleting…' : 'Delete'}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>HABITS</Text>
        {onAddHabitPress ? (
          <Pressable onPress={onAddHabitPress} style={styles.addHabitBtn}>
            <Text style={styles.addHabitBtnText}>+ NEW HABIT</Text>
          </Pressable>
        ) : null}
      </View>
      {habits.length > 0 && (
        <Text style={styles.habitCounter}>
          {(() => {
            const today = new Date().toISOString().slice(0, 10);
            const completedToday = habits.filter(
              (h) => h.last_logged_at && h.last_logged_at.slice(0, 10) === today
            ).length;
            return `Habits: ${completedToday} / ${habits.length}`;
          })()}
        </Text>
      )}
      {habits.length === 0 ? (
        <Text style={styles.emptyText}>No habits yet. Create one to build discipline.</Text>
      ) : (
        Object.entries(habitsByCategory).map(([key, categoryHabits]) => (
          <View key={key} style={styles.categoryGroup}>
            <Text style={styles.categoryLabel}>{(categoryHabits[0]?.category ?? key).toUpperCase()}</Text>
            {categoryHabits.map((habit) => {
              const isGood = habit.habit_type === 'good';
              const today = new Date().toISOString().slice(0, 10);
              const loggedToday = habit.last_logged_at ? habit.last_logged_at.slice(0, 10) === today : false;
              const canPressPlus = isGood && !loggedToday;
              const leftBtn = isGood ? (
                <Pressable
                  onPress={() => canPressPlus && handlePlus(habit)}
                  style={[styles.habitSideBtn, styles.habitBtnGood, loggedToday && styles.habitBtnGreyed]}
                  disabled={loggedToday}
                >
                  <Text style={styles.habitSideBtnText}>+</Text>
                </Pressable>
              ) : (
                <View style={styles.habitSideBtnPlaceholder} />
              );
              const rightBtn = isGood ? (
                <View style={styles.habitSideBtnPlaceholder} />
              ) : (
                <Pressable
                  onPress={() => handleMinus(habit)}
                  style={[styles.habitSideBtn, styles.habitBtnBad]}
                >
                  <Text style={styles.habitSideBtnText}>−</Text>
                </Pressable>
              );
              return (
                <View key={habit.id} style={styles.habitRow}>
                  {leftBtn}
                  <Pressable style={styles.habitInfo} onPress={() => setDetailsHabit(habit)}>
                    <Text style={styles.habitName}>{habit.name} [{habit.check_count ?? 0}]</Text>
                    {habit.description ? (
                      <Text style={styles.habitDescription}>{habit.description}</Text>
                    ) : null}
                  </Pressable>
                  {rightBtn}
                </View>
              );
            })}
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#737373',
    letterSpacing: 1.5,
  },
  addHabitBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addHabitBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  categoryGroup: {
    gap: 10,
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A3A3A3',
    letterSpacing: 0.5,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  habitSideBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitBtnGood: {
    backgroundColor: '#10B981',
  },
  habitBtnBad: {
    backgroundColor: '#EF4444',
  },
  habitBtnGreyed: {
    opacity: 0.5,
  },
  habitSideBtnPlaceholder: {
    width: 40,
    height: 40,
  },
  habitSideBtnText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  habitInfo: {
    flex: 1,
    minWidth: 0,
  },
  habitName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  habitDescription: {
    fontSize: 12,
    color: '#737373',
  },
  emptyText: {
    fontSize: 14,
    color: '#737373',
    fontStyle: 'italic',
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmBox: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 14,
    color: '#D1D5DB',
    marginBottom: 20,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  confirmCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
  },
  confirmCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  confirmDeleteBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#7F1D1D',
  },
  confirmDeleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FCA5A5',
  },
});

