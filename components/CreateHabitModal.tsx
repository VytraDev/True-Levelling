import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { getPlayerNameByUserId } from '../lib/playerAPI';

interface CreateHabitModalProps {
  visible: boolean;
  onClose: () => void;
  onHabitCreated: () => void;
}

export function CreateHabitModal({
  visible,
  onClose,
  onHabitCreated,
}: CreateHabitModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [habitType, setHabitType] = useState<'good' | 'bad' | null>(null);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim() || !category.trim() || !habitType) {
      setError('All fields required');
      return;
    }

    setError('');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const authUserId = sessionData?.session?.user?.id;
      if (!authUserId) {
        setError('Not authenticated');
        return;
      }

      const categoryTrimmed = category.trim();
      const categoryForStorage = categoryTrimmed.toLowerCase();
      const playerName = await getPlayerNameByUserId(authUserId);
      await supabase.from('habits').insert([
        {
          player_id: authUserId,
          player_name: playerName,
          name: name.trim(),
          description: description.trim(),
          habit_type: habitType,
          category: categoryForStorage,
        },
      ]);

      setName('');
      setDescription('');
      setCategory('');
      setHabitType(null);

      onHabitCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create habit');
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setCategory('');
    setHabitType(null);
    setError('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>CREATE HABIT</Text>
              <Pressable onPress={handleClose} hitSlop={8}>
                <Text style={styles.closeBtn}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Habit Name</Text>
              <TextInput
                style={styles.input}
                placeholder="E.g., 'Drank water'"
                placeholderTextColor="#737373"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Description (optional)</Text>
              <TextInput
                style={[styles.input, styles.smallInput]}
                placeholder="Brief note"
                placeholderTextColor="#737373"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                placeholder="E.g., 'Health', 'Productivity'"
                placeholderTextColor="#737373"
                value={category}
                onChangeText={setCategory}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeRow}>
                <Pressable
                  onPress={() => setHabitType('good')}
                  style={[
                    styles.typeBtn,
                    habitType === 'good' && styles.typeBtnActive,
                    habitType === 'good' && styles.typeBtnGood,
                  ]}
                >
                  <Text style={styles.typeBtnText}>Good Habit ✓</Text>
                </Pressable>
                <Pressable
                  onPress={() => setHabitType('bad')}
                  style={[
                    styles.typeBtn,
                    habitType === 'bad' && styles.typeBtnActive,
                    habitType === 'bad' && styles.typeBtnBad,
                  ]}
                >
                  <Text style={styles.typeBtnText}>Bad Habit ✗</Text>
                </Pressable>
              </View>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleCreate}
              style={[
                styles.createBtn,
                (!name.trim() || !category.trim() || !habitType) &&
                  styles.createBtnDisabled,
              ]}
              disabled={!name.trim() || !category.trim() || !habitType}
            >
              <Text style={styles.createBtnText}>Create Habit</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modal: {
    flex: 0.7,
    backgroundColor: '#0F0F0F',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  content: {
    padding: 24,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  closeBtn: {
    fontSize: 24,
    color: '#737373',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A3A3A3',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  smallInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    alignItems: 'center',
  },
  typeBtnActive: {
    borderWidth: 2,
  },
  typeBtnGood: {
    borderColor: '#16A34A',
    backgroundColor: '#1A2E1A',
  },
  typeBtnBad: {
    borderColor: '#DC2626',
    backgroundColor: '#2E1A1A',
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorBox: {
    backgroundColor: '#7F1D1D',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: '#FCA5A5',
  },
  createBtn: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createBtnDisabled: {
    opacity: 0.5,
  },
  createBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

