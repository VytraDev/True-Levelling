import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

interface Habit {
  id: string;
  name: string;
  description: string;
  habit_type: 'good' | 'bad';
  category: string;
}

interface HabitDetailsModalProps {
  visible: boolean;
  habit: Habit | null;
  onClose: () => void;
  onDelete?: (habitId: string, habitName: string) => void;
}

export function HabitDetailsModal({
  visible,
  habit,
  onClose,
  onDelete,
}: HabitDetailsModalProps) {
  if (!habit) return null;

  const handleDelete = () => {
    onDelete?.(habit.id, habit.name);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.box} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>{habit.name}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.closeBtn}>✕</Text>
            </Pressable>
          </View>
          {habit.description ? (
            <Text style={styles.description}>{habit.description}</Text>
          ) : null}
          <View style={[styles.typeBadge, habit.habit_type === 'good' ? styles.typeGood : styles.typeBad]}>
            <Text style={styles.typeBadgeText}>
              {habit.habit_type === 'good' ? 'Good Habit' : 'Bad Habit'}
            </Text>
          </View>
          {onDelete ? (
            <Pressable
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Text style={styles.deleteButtonText}>Delete habit</Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
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
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
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
  description: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
    marginBottom: 12,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  typeGood: { backgroundColor: '#16A34A' },
  typeBad: { backgroundColor: '#DC2626' },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deleteButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#7F1D1D',
    borderRadius: 8,
    marginBottom: 16,
  },
  deleteButtonText: { fontSize: 14, fontWeight: '600', color: '#FCA5A5' },
  closeButton: {
    backgroundColor: '#2A2A2A',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
});
