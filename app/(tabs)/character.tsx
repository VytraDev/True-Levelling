import { useState } from 'react';
import { router } from 'expo-router';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Modal,
  RefreshControl,
} from 'react-native';
import { usePlayerStore } from '../../store/playerStore';
import { CLASS_CONFIG, getTotalAP, getSpentAP } from '../../lib/classEngine';
import type { PlayerClass } from '../../lib/classEngine';
import { supabase } from '../../lib/supabase';
import { getRankProgress } from '../../lib/rankEngine';
import { ThresholdModal } from '../../components/ThresholdModal';
import { ClassesInformationModal } from '../../components/ClassesInformationModal';
import { ClassChangeModal } from '../../components/ClassChangeModal';
import { CombatStatsModule } from '../../components/CombatStatsModule';
import { StatusBars } from '../../components/StatusBars';
import { useToastStore } from '../../store/toastStore';

const isWeb = Platform.OS === 'web';

type PercentageWidth = `${number}%`;

const ATTRIBUTE_KEYS = [
  { key: 'str' as const, label: 'STR' },
  { key: 'agi' as const, label: 'AGI' },
  { key: 'int' as const, label: 'INT' },
  { key: 'vit' as const, label: 'VIT' },
  { key: 'endurance' as const, label: 'END' },
];

export default function CharacterScreen() {
  const name = usePlayerStore((s) => s.name);
  const level = usePlayerStore((s) => s.level);
  const rank = usePlayerStore((s) => s.rank);
  const rankXp = usePlayerStore((s) => s.rankXp);
  const stats = usePlayerStore((s) => s.stats);
  const ap = usePlayerStore((s) => s.ap);
  const playerClass = usePlayerStore((s) => s.playerClass);
  const accentColor = usePlayerStore((s) => s.accentColor);
  const classJustChanged = usePlayerStore((s) => s.classJustChanged);
  const allocateAP = usePlayerStore((s) => s.allocateAP);
  const resetStats = usePlayerStore((s) => s.resetStats);
  const thresholdAlert = usePlayerStore((s) => s.thresholdAlert);
  const dismissThresholdAlert = usePlayerStore((s) => s.dismissThresholdAlert);
  const classChangeModal = usePlayerStore((s) => s.classChangeModal);
  const dismissClassChangeModal = usePlayerStore((s) => s.dismissClassChangeModal);
  const resetBannerVisible = usePlayerStore((s) => s.resetBannerVisible);
  const resetRequested = usePlayerStore((s) => s.resetRequested);
  const cancelReset = usePlayerStore((s) => s.cancelReset);
  const loadPlayer = usePlayerStore((s) => s.loadPlayer);
  const combatStats = usePlayerStore((s) => s.combatStats);
  const currentHP = usePlayerStore((s) => s.currentHP);
  const currentMP = usePlayerStore((s) => s.currentMP);
  const currentStamina = usePlayerStore((s) => s.currentStamina);
  const [showClassesModal, setShowClassesModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const playerId = usePlayerStore((s) => s.id);

  const totalAP = getTotalAP(level);
  const spentAP = getSpentAP(stats);
  const availableAP = ap;

  const handleConfirmReset = () => {
    resetStats();
    router.push('/(tabs)/character');
    cancelReset();
  };

  const handleClassChangeAccept = () => {
    dismissClassChangeModal();
    useToastStore.getState().addToast(`✓ Class updated: ${classInfo.label}`);
  };

  const refreshPlayer = async () => {
    if (!playerId) return;
    const todayIso = new Date().toISOString().slice(0, 10);
    const { data: row } = await supabase.from('players').select('*').eq('id', playerId).maybeSingle();
    if (!row) return;
    const rowWithAttempts = row as { custom_quest_attempts_today?: number; custom_quest_attempts_reset_date?: string | null };
    let attemptsToday = rowWithAttempts.custom_quest_attempts_today ?? 0;
    let attemptsResetDate = rowWithAttempts.custom_quest_attempts_reset_date ?? null;
    if (attemptsResetDate !== todayIso) {
      attemptsToday = 0;
      attemptsResetDate = todayIso;
    }
    loadPlayer({
      id: row.id,
      name: row.name,
      level: row.level,
      xp: row.xp,
      rankXp: row.rank_xp,
      rank: row.rank,
      gold: row.gold,
      penaltyGauge: row.penalty_gauge,
      breakDays: (row as { break_days?: number[] }).break_days ?? [],
      lastBreakDayChange: (row as { last_break_day_change?: string | null }).last_break_day_change ?? null,
      lastPenaltyDate: (row as { last_penalty_date?: string | null }).last_penalty_date ?? null,
      punishmentTriggered: (row as { punishment_triggered?: boolean | null }).punishment_triggered ?? false,
      stats: { str: row.str, agi: row.agi, int: row.int, vit: row.vit, endurance: row.endurance },
      ap: row.ap,
      playerClass: (row.player_class as PlayerClass) ?? 'unclassed',
      customQuestAttemptsToday: attemptsToday,
      customQuestAttemptsResetDate: attemptsResetDate,
    });
  };

  const rankProgress = getRankProgress(rank, rankXp);
  const gradeFillWidth: PercentageWidth = `${rankProgress.progress * 100}%`;
  const classInfo = CLASS_CONFIG[playerClass];

  return (
    <View style={[styles.outer, isWeb && styles.outerWeb]}>
      <View style={[styles.container, isWeb && styles.containerWeb]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await refreshPlayer();
                setRefreshing(false);
              }}
              tintColor={accentColor}
            />
          }
        >
        {classJustChanged && (
          <View style={[styles.classBanner, { backgroundColor: accentColor }]}>
            <Text style={styles.classBannerText}>
              Class Updated: {classInfo.label}
            </Text>
          </View>
        )}

        <View style={styles.topSection}>
          <View style={styles.nameRow}>
            <Text style={styles.playerName}>{name}</Text>
          </View>
          <View style={styles.badgeRow}>
            <View style={[styles.rankBadge, { backgroundColor: accentColor }]}>
              <Text style={styles.rankBadgeText}>{rank}-RANK</Text>
            </View>
            <View style={[styles.classBadge, { borderColor: accentColor }]}>
              <Text style={[styles.classBadgeText, { color: accentColor }]}>
                {classInfo.label}
              </Text>
            </View>
          </View>
          <Text style={styles.levelText}>LEVEL {level}</Text>
          <Text style={styles.apSpentLine}>
            AP Spent: {spentAP} / {totalAP}
          </Text>
          <Text
            style={[
              styles.apAvailableLine,
              availableAP > 0 && styles.apAvailableLinePurple,
            ]}
          >
            AP Available: {availableAP}
          </Text>
          <Pressable
            style={styles.classInfoButton}
            onPress={() => setShowClassesModal(true)}
          >
            <Text style={styles.classInfoButtonText}>[?] Classes Information</Text>
          </Pressable>
        </View>

        <ClassesInformationModal
          visible={showClassesModal}
          onClose={() => setShowClassesModal(false)}
        />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>GRADE POINTS</Text>
          <View style={styles.xpTrack}>
            <View style={[styles.xpFill, { width: gradeFillWidth, backgroundColor: accentColor }]} />
          </View>
          <Text style={styles.xpDescription}>
            {rank === 'Monarch'
              ? 'MAX RANK'
              : `${rankProgress.current.toLocaleString()} / ${rankProgress.max.toLocaleString()} XP to ${rankProgress.next}-Rank`}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ATTRIBUTES</Text>
          <View style={styles.statsGrid}>
            {ATTRIBUTE_KEYS.map(({ key, label }) => (
              <View key={key} style={styles.statCard}>
                <Text style={[styles.statLabel, { color: accentColor }]}>{label}</Text>
                <Text style={styles.statValue}>{stats[key]}</Text>
                {ap > 0 && (
                  <Pressable
                    style={[styles.plusButton, { backgroundColor: accentColor }]}
                    onPress={() => allocateAP(key)}
                  >
                    <Text style={styles.plusButtonText}>+1</Text>
                  </Pressable>
                )}
              </View>
            ))}
            <View style={[styles.statCard, styles.statCardAp]}>
              <Text style={[styles.statLabel, styles.statLabelAp]}>AP</Text>
              <Text style={[styles.statValue, styles.statValueAp]}>{ap}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footerText}>
          Distribute AP after leveling up
        </Text>

        <CombatStatsModule combatStats={combatStats} accentColor={accentColor} />

        <StatusBars
          maxHP={combatStats.hp}
          maxMP={combatStats.mp}
          maxSTA={combatStats.sta}
          currentHP={currentHP}
          currentMP={currentMP}
          currentStamina={currentStamina}
          accentColor={accentColor}
        />

        <Modal
          visible={resetRequested}
          transparent
          animationType="fade"
          onRequestClose={() => cancelReset()}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Reset Stat Allocation?</Text>
              <Text style={styles.modalBody}>
          This will cost you 5 levels and reset all allocated points.
          Your class will return to Unclassed. This cannot be undone.
              </Text>
              <View style={styles.modalButtons}>
                <Pressable
                  style={styles.modalCancelButton}
                  onPress={() => cancelReset()}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={styles.modalConfirmButton}
                  onPress={handleConfirmReset}
                >
                  <Text style={styles.modalConfirmText}>Confirm Reset</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {resetBannerVisible && (
          <View style={styles.resetBanner}>
            <Text style={styles.resetBannerText}>
              The System has rewritten your existence.
            </Text>
          </View>
        )}

        </ScrollView>
        <ThresholdModal
          visible={!!thresholdAlert}
          alert={thresholdAlert}
          onDismiss={dismissThresholdAlert}
        />

        {classChangeModal && (
          <ClassChangeModal
            visible={!!classChangeModal}
            previousClass={classChangeModal.previousClass}
            newClass={classChangeModal.newClass}
            onAccept={handleClassChangeAccept}
          />
        )}
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
    paddingBottom: 24,
  },
  containerWeb: {
    maxWidth: 390,
    width: '100%',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  playerName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  classBanner: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
  },
  classBannerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  rankBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  rankBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  classBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  classBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  levelText: {
    fontSize: 64,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  apSpentLine: {
    fontSize: 12,
    color: '#737373',
    marginBottom: 2,
  },
  apAvailableLine: {
    fontSize: 12,
    color: '#737373',
    marginBottom: 8,
  },
  apAvailableLinePurple: {
    color: '#8B5CF6',
  },
  classLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  classInfoButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#252525',
    borderRadius: 10,
    alignSelf: 'center',
  },
  classInfoButtonText: {
    fontSize: 14,
    color: '#A3A3A3',
    fontWeight: '600',
  },
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 11,
    color: '#737373',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  xpTrack: {
    height: 10,
    backgroundColor: '#1F1F1F',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 8,
  },
  xpFill: {
    height: '100%',
    borderRadius: 999,
  },
  xpDescription: {
    fontSize: 13,
    color: '#A3A3A3',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    position: 'relative',
  },
  plusButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  plusButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  statCardAp: {
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  statLabelAp: {
    color: '#F59E0B',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statValueAp: {
    color: '#F59E0B',
  },
  footerText: {
    fontSize: 12,
    color: '#737373',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalBody: {
    fontSize: 14,
    color: '#A3A3A3',
    lineHeight: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  modalCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#2A2A2A',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E5E5',
  },
  modalConfirmButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#7F1D1D',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  resetBanner: {
    backgroundColor: '#7F1D1D',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  resetBannerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
