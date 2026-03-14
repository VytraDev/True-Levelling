import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { usePlayerStore, CUSTOM_QUEST_ATTEMPTS_PER_DAY } from '../store/playerStore';
import { useToastStore } from '../store/toastStore';
import { supabase } from '../lib/supabase';
import { evaluateCustomQuestWithClaude } from '../lib/customQuestAPI';
import { getPlayerNameByUserId } from '../lib/playerAPI';

interface CustomQuestFormProps {
  visible: boolean;
  onClose: () => void;
  onQuestCreated: () => void;
  attemptCount: number;
  maxAttemptsPerDay?: number;
}

const DEFAULT_MAX_ATTEMPTS = 5;
const DD_MM_YYYY_REGEX = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;
const FIXED_DEADLINE_TIME = '23:59';

/** Parse DD-MM-YYYY to ISO YYYY-MM-DD or null if invalid */
function ddMmYyyyToIso(input: string): string | null {
  const trimmed = input.trim();
  const match = trimmed.match(DD_MM_YYYY_REGEX);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const year = parseInt(match[3], 10);
  if (month < 0 || month > 11 || day < 1 || day > 31) return null;
  const date = new Date(year, month, day);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null;
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Returns true if deadline (ISO date + HH:MM time) is in the past */
function isDeadlineInPast(deadlineIso: string, timeStr: string): boolean {
  const [h, m] = timeStr.split(':').map(Number);
  const end = new Date(deadlineIso);
  end.setHours(h ?? 23, m ?? 59, 0, 0);
  return end.getTime() <= Date.now();
}

/** Format ISO (YYYY-MM-DD) to DD-MM-YYYY for display */
function isoToDdMmYyyy(iso: string): string {
  const [y, m, d] = iso.split('-');
  return [d, m, y].join('-');
}

/** Get today in YYYY-MM-DD */
function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function CustomQuestForm({
  visible,
  onClose,
  onQuestCreated,
  attemptCount: _attemptCountProp,
  maxAttemptsPerDay = DEFAULT_MAX_ATTEMPTS,
}: CustomQuestFormProps) {
  // Use store as single source of truth so attempt count stays in sync between form and rejection UI
  const customQuestAttemptsToday = usePlayerStore((s) => s.customQuestAttemptsToday ?? 0);
  const attemptCount = customQuestAttemptsToday;
  const attemptsLeft = Math.max(0, maxAttemptsPerDay - attemptCount);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [error, setError] = useState('');
  const [evaluationStage, setEvaluationStage] =
    useState<'idle' | 'thinking' | 'result'>('idle');
  const evaluatingRef = useRef(false);

  const playerLevel = usePlayerStore((s) => s.level);
  const playerId = usePlayerStore((s) => s.id);

  const deadlineIsoForValidation = ddMmYyyyToIso(deadlineDate);
  const deadlineInPast = deadlineIsoForValidation
    ? isDeadlineInPast(deadlineIsoForValidation, FIXED_DEADLINE_TIME)
    : false;

  const handleEvaluate = async () => {
    if (evaluatingRef.current) return;
    if (!name.trim() || !description.trim() || !deadlineDate.trim()) {
      setError('All fields required');
      return;
    }
    const deadlineIso = ddMmYyyyToIso(deadlineDate);
    if (!deadlineIso) {
      setError('Deadline must be DD-MM-YYYY (e.g. 25-12-2025)');
      return;
    }
    if (isDeadlineInPast(deadlineIso, FIXED_DEADLINE_TIME)) {
      setError('Deadline cannot be in the past');
      useToastStore.getState().addToast('Deadline cannot be in the past');
      return;
    }

    setError('');
    evaluatingRef.current = true;
    setEvaluating(true);
    setEvaluationStage('thinking');

    try {
      const result = await evaluateCustomQuestWithClaude(
        name,
        description,
        playerLevel || 1
      );
      console.log('Got evaluation result:', result);
      setEvaluation(result);
      setEvaluationStage('result');
      setEvaluating(false);

      if (!result.approved && playerId) {
        const newUsed = Math.min(usePlayerStore.getState().customQuestAttemptsToday + 1, maxAttemptsPerDay);
        await supabase
          .from('players')
          .update({ custom_quest_attempts_today: newUsed })
          .eq('id', playerId);
        usePlayerStore.setState({ customQuestAttemptsToday: newUsed });
        console.log('[CUSTOM QUEST] Evaluation rejected, attempts decremented:', newUsed, '/ 5');
        useToastStore.getState().addToast(`Attempt used. ${maxAttemptsPerDay - newUsed} remaining.`);
      }
    } catch (err) {
      console.error('Evaluation failed:', err);
      const message = err instanceof Error ? err.message : 'Evaluation failed';
      setError(message);
      setEvaluationStage('idle');
      setEvaluating(false);
      useToastStore.getState().addToast(`✗ ${message}`);
      if (playerId) {
        const newUsed = Math.min(usePlayerStore.getState().customQuestAttemptsToday + 1, maxAttemptsPerDay);
        await supabase
          .from('players')
          .update({ custom_quest_attempts_today: newUsed })
          .eq('id', playerId);
        usePlayerStore.setState({ customQuestAttemptsToday: newUsed });
        console.log('[CUSTOM QUEST] Evaluation failed (network/error), attempts decremented:', newUsed, '/ 5');
      }
    } finally {
      evaluatingRef.current = false;
      setEvaluating(false);
    }
  };

  const handleCreateQuest = async (result: any) => {
    if (!result.approved) return;

    const deadlineIso = ddMmYyyyToIso(deadlineDate);
    if (!deadlineIso) {
      setError('Invalid deadline format');
      return;
    }
    if (isDeadlineInPast(deadlineIso, FIXED_DEADLINE_TIME)) {
      setError('Deadline cannot be in the past');
      useToastStore.getState().addToast('Deadline cannot be in the past');
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const authUserId = sessionData?.session?.user?.id;
    if (!authUserId) {
      setError('Not authenticated');
      setEvaluationStage('idle');
      return;
    }

    try {
      const playerName = await getPlayerNameByUserId(authUserId);
      const { error: insertError } = await supabase
        .from('custom_quests')
        .insert([
          {
            player_id: authUserId,
            player_name: playerName,
            name: name.trim(),
            description: description.trim(),
            difficulty: result.difficulty,
            xp_reward: result.xp_reward,
            gold_reward: result.gold_reward,
            deadline_date: deadlineIso,
            deadline_time: FIXED_DEADLINE_TIME,
            is_active: true,
          },
        ]);

      if (insertError) throw insertError;

      console.log(
        '[CUSTOM QUEST FORM] Custom quest deadline set to',
        deadlineDate,
        `${FIXED_DEADLINE_TIME} (midnight)`
      );

      setName('');
      setDescription('');
      setDeadlineDate('');
      setEvaluation(null);
      setEvaluationStage('idle');

      onQuestCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create quest');
      setEvaluationStage('idle');
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setDeadlineDate('');
    setEvaluation(null);
    setError('');
    setEvaluating(false);
    setEvaluationStage('idle');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={styles.title}>CREATE CUSTOM QUEST</Text>
              <Pressable onPress={handleClose} hitSlop={8}>
                <Text style={styles.closeBtn}>✕</Text>
              </Pressable>
            </View>

            {evaluationStage === 'idle' && (
              <>
                <View style={styles.section}>
                  <Text style={styles.label}>Quest Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="E.g., 'Clean bedroom thoroughly'"
                    placeholderTextColor="#737373"
                    value={name}
                    onChangeText={setName}
                    editable={!evaluating}
                  />
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>Description</Text>
                  <Text style={styles.hint}>
                    Be detailed and specific. The more genuine your description,
                    the more likely approval.
                  </Text>
                  <TextInput
                    style={[styles.input, styles.largeInput]}
                    placeholder="Describe exactly what you'll do, how long it takes, and why it matters to you..."
                    placeholderTextColor="#737373"
                    value={description}
                    onChangeText={setDescription}
                    editable={!evaluating}
                    multiline
                    numberOfLines={5}
                  />
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>Deadline</Text>
                  <View style={styles.dateTimeRow}>
                    {Platform.OS === 'web' ? (
                      <>
                        <View style={styles.pickerRow}>
                          <Text style={styles.pickerLabel}>📅 Date:</Text>
                          <input
                            type="date"
                            min={getTodayIso()}
                            value={deadlineIsoForValidation || ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (v) setDeadlineDate(isoToDdMmYyyy(v));
                            }}
                            style={{
                              flex: 1,
                              padding: 12,
                              borderRadius: 12,
                              border: '1px solid #2A2A2A',
                              backgroundColor: '#1A1A1A',
                              color: '#FFF',
                              fontSize: 14,
                            }}
                          />
                        </View>
                      </>
                    ) : (
                      <>
                        <TextInput
                          style={[styles.input, styles.dateInput]}
                          placeholder="DD-MM-YYYY"
                          placeholderTextColor="#737373"
                          value={deadlineDate}
                          onChangeText={(value) => {
                            setDeadlineDate(value);
                            if (value.trim()) {
                              console.log('[CUSTOM QUEST FORM] Date set to:', value.trim());
                            }
                          }}
                          editable={!evaluating}
                        />
                      </>
                    )}
                  </View>
                </View>

                {error ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={styles.attemptsBox}>
                  <Text style={styles.attemptsText}>
                    Attempts remaining: {attemptsLeft}/{maxAttemptsPerDay}
                  </Text>
                </View>

                <Pressable
                  onPress={handleEvaluate}
                  style={[
                    styles.evaluateBtn,
                    (evaluating || attemptsLeft <= 0 || !deadlineIsoForValidation || deadlineInPast) &&
                      styles.evaluateBtnDisabled,
                  ]}
                  disabled={
                    evaluating ||
                    attemptsLeft <= 0 ||
                    !name.trim() ||
                    !description.trim() ||
                    !deadlineDate.trim() ||
                    !deadlineIsoForValidation ||
                    deadlineInPast
                  }
                >
                  {evaluating ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.evaluateBtnText}>
                      Submit For Evaluation
                    </Text>
                  )}
                </Pressable>
              </>
            )}

            {evaluationStage === 'thinking' && (
              <View style={styles.thinkingBox}>
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text style={styles.thinkingText}>
                  The System is evaluating your request...
                </Text>
              </View>
            )}

            {evaluationStage === 'result' && evaluation && (
              <View>
                {evaluation.approved ? (
                  <View style={styles.approvalBox}>
                    <Text style={styles.approvalTitle}>
                      ✓ THE SYSTEM APPROVES YOUR DEDICATION
                    </Text>
                    <Text style={styles.approvalReasoning}>
                      {evaluation.reasoning}
                    </Text>
                    <View style={styles.rewardRow}>
                      <View style={styles.rewardBadge}>
                        <Text style={styles.rewardLabel}>Difficulty</Text>
                        <Text style={styles.rewardValue}>
                          {evaluation.difficulty.toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.rewardBadge}>
                        <Text style={styles.rewardLabel}>XP</Text>
                        <Text
                          style={[styles.rewardValue, { color: '#8B5CF6' }]}
                        >
                          +{evaluation.xp_reward}
                        </Text>
                      </View>
                      <View style={styles.rewardBadge}>
                        <Text style={styles.rewardLabel}>Gold</Text>
                        <Text
                          style={[styles.rewardValue, { color: '#F59E0B' }]}
                        >
                          +{evaluation.gold_reward}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.rejectionBox}>
                    <Text style={styles.rejectionTitle}>
                      ✗ THE SYSTEM DOES NOT TOLERATE THE CARELESS
                    </Text>
                    <Text style={styles.rejectionReasoning}>
                      {evaluation.reasoning}
                    </Text>
                    <Text style={styles.attemptsLeftText}>
                      Attempts remaining: {attemptsLeft}/{maxAttemptsPerDay}
                    </Text>
                  </View>
                )}

                <Pressable
                  onPress={() => {
                    if (evaluation.approved) {
                      handleCreateQuest(evaluation);
                    } else {
                      setEvaluation(null);
                      setEvaluationStage('idle');
                    }
                  }}
                  style={[
                    styles.continueBtn,
                    evaluation.approved && styles.continueBtnApproved,
                  ]}
                >
                  <Text style={styles.continueBtnText}>
                    {evaluation.approved ? 'Accept Quest' : 'Try Again'}
                  </Text>
                </Pressable>
              </View>
            )}
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
    flex: 0.9,
    backgroundColor: '#0F0F0F',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
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
  hint: {
    fontSize: 12,
    color: '#737373',
    marginBottom: 8,
    fontStyle: 'italic',
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
  largeInput: {
    textAlignVertical: 'top',
    minHeight: 120,
  },
  dateTimeRow: {
    gap: 12,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickerLabel: {
    fontSize: 12,
    color: '#A3A3A3',
    minWidth: 60,
  },
  dateInput: {
    flex: 2,
  },
  timeInput: {
    flex: 1,
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
  attemptsBox: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  attemptsText: {
    fontSize: 13,
    color: '#A3A3A3',
    textAlign: 'center',
  },
  evaluateBtn: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  evaluateBtnDisabled: {
    opacity: 0.5,
  },
  evaluateBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  thinkingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  thinkingText: {
    fontSize: 16,
    color: '#E5E5E5',
    marginTop: 20,
    fontStyle: 'italic',
  },
  approvalBox: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    backgroundColor: '#1A2E1A',
    borderWidth: 2,
    borderColor: '#16A34A',
  },
  approvalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16A34A',
    letterSpacing: 1,
    marginBottom: 12,
  },
  approvalReasoning: {
    fontSize: 14,
    color: '#E5E5E5',
    lineHeight: 20,
    marginBottom: 16,
  },
  rejectionBox: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    backgroundColor: '#2E1A1A',
    borderWidth: 2,
    borderColor: '#DC2626',
  },
  rejectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
    letterSpacing: 1,
    marginBottom: 12,
  },
  rejectionReasoning: {
    fontSize: 14,
    color: '#E5E5E5',
    lineHeight: 20,
    marginBottom: 12,
  },
  attemptsLeftText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '600',
  },
  rewardRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rewardBadge: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  rewardLabel: {
    fontSize: 11,
    color: '#737373',
    marginBottom: 4,
  },
  rewardValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16A34A',
  },
  continueBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#DC2626',
    alignItems: 'center',
  },
  continueBtnApproved: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
