import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { usePlayerStore } from '../store/playerStore';
import { supabase } from '../lib/supabase';
import { FeedbackModal } from './FeedbackModal';
import { PatchNotesModal } from './PatchNotesModal';

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
}

export function SettingsModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const name = usePlayerStore((s) => s.name);
  const setName = usePlayerStore((s) => s.setName);
  const breakDays = usePlayerStore((s) => s.breakDays);
  const setBreakDays = usePlayerStore((s) => s.setBreakDays);
  const breakDayChangeBlocked = usePlayerStore((s) => s.breakDayChangeBlocked);
  const requestReset = usePlayerStore((s) => s.requestReset);

  const [nameEditing, setNameEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);
  const [pendingDays, setPendingDays] = useState<number[]>([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showPatchNotes, setShowPatchNotes] = useState(false);

  useEffect(() => {
    if (visible) {
      setNameDraft(name);
      setPendingDays([...breakDays].sort((a, b) => a - b));
    }
  }, [visible, name, breakDays]);

  const handleDayToggle = (dayNum: number) => {
    const isSelected = pendingDays.includes(dayNum);
    let next: number[];
    if (isSelected) {
      next = pendingDays.filter((d) => d !== dayNum);
    } else if (pendingDays.length >= 2) {
      return;
    } else {
      next = [...pendingDays, dayNum].sort((a, b) => a - b);
    }
    setPendingDays(next);
  };

  const confirmName = () => {
    const trimmed = nameDraft.trim();
    if (trimmed) setName(trimmed);
    setNameEditing(false);
  };

  const canConfirmBreakDays =
    pendingDays.length === 2 && !arraysEqual(pendingDays, breakDays);

  const handleConfirmBreakDays = () => {
    if (!canConfirmBreakDays) return;
    if (breakDayChangeBlocked) return;
    setBreakDays(pendingDays);
  };

  const handleResetStats = () => {
    onClose();
    setTimeout(() => {
      requestReset();
      router.push('/(tabs)/character');
    }, 400);
  };

  const handleEditAppearance = () => {
    onClose();
    setTimeout(() => {
      router.push('/character-creation?edit=true');
    }, 400);
  };

  const handleLogoutPress = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  const handleLogoutConfirm = async () => {
    onClose();
    await new Promise((resolve) => setTimeout(resolve, 350));

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.log('Logout error:', error.message);
      return;
    }
    console.log('Signed out ✓');

    usePlayerStore.getState().resetToDefaults();
    router.replace('/login');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <Pressable style={styles.close} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
          <Text style={styles.title}>SETTINGS</Text>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ACCOUNT</Text>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Player Name</Text>
              {nameEditing ? (
                <View style={styles.rowEdit}>
                  <TextInput
                    style={styles.nameInput}
                    value={nameDraft}
                    onChangeText={setNameDraft}
                    autoFocus
                    placeholder="Name"
                    placeholderTextColor="#737373"
                  />
                  <Pressable style={styles.confirmBtn} onPress={confirmName}>
                    <Text style={styles.confirmBtnText}>✓</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable style={styles.rowValue} onPress={() => setNameEditing(true)}>
                  <Text style={styles.rowValueText}>{name}</Text>
                </Pressable>
              )}
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Edit Appearance</Text>
              <Pressable style={styles.rowValue} onPress={handleEditAppearance}>
                <Text style={styles.rowValueText}>Open character creator</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>BREAK DAYS</Text>
            <View style={styles.breakDaysRow}>
              {DAY_LABELS.map((label, i) => {
                const dayNum = i;
                const selected = pendingDays.includes(dayNum);
                return (
                  <Pressable
                    key={dayNum}
                    style={[
                      styles.dayBtn,
                      selected ? styles.dayBtnSelected : styles.dayBtnUnselected,
                    ]}
                    onPress={() => handleDayToggle(dayNum)}
                  >
                    <Text
                      style={[
                        styles.dayBtnText,
                        selected ? styles.dayBtnTextSelected : styles.dayBtnTextUnselected,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.breakDaysCount}>
              {pendingDays.length} / 2 days selected
            </Text>
            {breakDayChangeBlocked && (
              <Text style={styles.breakDaysError}>
                Break days can only be changed once per week
              </Text>
            )}
            <Pressable
              style={[
                styles.confirmBreakDaysBtn,
                canConfirmBreakDays && !breakDayChangeBlocked
                  ? styles.confirmBreakDaysBtnEnabled
                  : styles.confirmBreakDaysBtnDisabled,
              ]}
              onPress={handleConfirmBreakDays}
              disabled={!canConfirmBreakDays || breakDayChangeBlocked}
            >
              <Text
                style={[
                  styles.confirmBreakDaysBtnText,
                  canConfirmBreakDays && !breakDayChangeBlocked
                    ? styles.confirmBreakDaysBtnTextEnabled
                    : styles.confirmBreakDaysBtnTextDisabled,
                ]}
              >
                Confirm Break Days
              </Text>
            </Pressable>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ABOUT</Text>
            <Pressable
              style={styles.feedbackBtn}
              onPress={() => {
                console.log('[SETTINGS] Patch Notes tapped');
                setShowPatchNotes(true);
              }}
            >
              <Text style={styles.feedbackBtnText}>📋 Patch Notes</Text>
            </Pressable>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>FEEDBACK</Text>
            <Pressable
              style={styles.feedbackBtn}
              onPress={() => setShowFeedbackModal(true)}
            >
              <Text style={styles.feedbackBtnText}>📝 Send Feedback / Report Bug</Text>
            </Pressable>
            <Text style={styles.feedbackHelpText}>
              Help us improve the game by sharing your feedback, bugs, or suggestions.
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DANGER ZONE</Text>
            <Pressable style={styles.resetBtn} onPress={handleResetStats}>
              <Text style={styles.resetBtnText}>Reset Stats (Cost: 5 Levels)</Text>
            </Pressable>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            {showLogoutConfirm ? (
              <View style={styles.logoutConfirmRow}>
                <Pressable
                  style={[styles.logoutConfirmBtn, styles.logoutCancelBtn]}
                  onPress={handleLogoutCancel}
                >
                  <Text style={styles.logoutCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.logoutConfirmBtn, styles.logoutConfirmBtnDanger]}
                  onPress={handleLogoutConfirm}
                >
                  <Text style={styles.logoutConfirmText}>Confirm Logout</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.logoutBtn} onPress={handleLogoutPress}>
                <Text style={styles.logoutBtnText}>Logout</Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Pressable>

      <FeedbackModal
        visible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />
      <PatchNotesModal
        visible={showPatchNotes}
        onClose={() => setShowPatchNotes(false)}
      />
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
  modal: {
    width: 320,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 16,
    padding: 20,
    paddingTop: 40,
    zIndex: 999,
  },
  close: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 18,
    color: '#888888',
  },
  title: {
    fontSize: 11,
    fontWeight: '600',
    color: '#737373',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    color: '#737373',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: {
    fontSize: 14,
    color: '#E5E5E5',
  },
  rowValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowValueText: {
    fontSize: 14,
    color: '#A3A3A3',
  },
  rowEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#FFFFFF',
    minWidth: 120,
  },
  confirmBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#16A34A',
  },
  confirmBtnText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2A2A',
    marginVertical: 12,
  },
  breakDaysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  dayBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 40,
  },
  dayBtnUnselected: {
    backgroundColor: '#1A1A1A',
  },
  dayBtnSelected: {
    backgroundColor: '#1A2E1A',
    borderWidth: 1,
    borderColor: '#16A34A',
  },
  dayBtnText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  dayBtnTextUnselected: {
    color: '#555555',
  },
  dayBtnTextSelected: {
    color: '#16A34A',
  },
  breakDaysCount: {
    fontSize: 12,
    color: '#737373',
    marginBottom: 8,
  },
  breakDaysError: {
    fontSize: 12,
    color: '#DC2626',
    marginBottom: 8,
  },
  confirmBreakDaysBtn: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  confirmBreakDaysBtnEnabled: {
    backgroundColor: '#8B5CF6',
  },
  confirmBreakDaysBtnDisabled: {
    backgroundColor: '#2A2A2A',
  },
  confirmBreakDaysBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBreakDaysBtnTextEnabled: {
    color: '#FFFFFF',
  },
  confirmBreakDaysBtnTextDisabled: {
    color: '#737373',
  },
  feedbackBtn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#404040',
    backgroundColor: '#252525',
    marginBottom: 8,
  },
  feedbackBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E5E5',
  },
  feedbackHelpText: {
    fontSize: 12,
    color: '#737373',
    lineHeight: 18,
  },
  resetBtn: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#7F1D1D',
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  logoutBtn: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#555555',
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#737373',
  },
  logoutConfirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  logoutConfirmBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  logoutCancelBtn: {
    borderWidth: 1,
    borderColor: '#555555',
    backgroundColor: '#1F2933',
  },
  logoutConfirmBtnDanger: {
    borderWidth: 1,
    borderColor: '#7F1D1D',
    backgroundColor: '#1F1010',
  },
  logoutCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  logoutConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FCA5A5',
  },
});
