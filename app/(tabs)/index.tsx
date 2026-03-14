import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
  Animated,
  ScrollView,
  Modal,
  RefreshControl,
} from 'react-native';
import { usePlayerStore, XP_PER_LEVEL, CUSTOM_QUEST_ATTEMPTS_PER_DAY } from '../../store/playerStore';
import { useToastStore } from '../../store/toastStore';
import { supabase } from '../../lib/supabase';
import { CLASS_CONFIG } from '../../lib/classEngine';
import { CATEGORY_CONFIG } from '../../lib/questConfig';
import { generateDailyQuests } from '../../lib/questEngine';
import { getPlayerNameByPlayerId } from '../../lib/playerAPI';
import { LevelUpModal } from '../../components/LevelUpModal';
import { PunishmentModal } from '../../components/PunishmentModal';
import { CustomQuestForm } from '../../components/CustomQuestForm';
import { CreateHabitModal } from '../../components/CreateHabitModal';
import { HabitsCard } from '../../components/HabitsCard';
import { QuestDetailsModal } from '../../components/QuestDetailsModal';
import { MissedQuestNotification } from '../../components/MissedQuestNotification';

const isWeb = Platform.OS === 'web';

const today = new Date();
const dateString = today.toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});
const todayKey = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, '0'),
  String(today.getDate()).padStart(2, '0'),
].join('-');

const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayKey = [
  yesterday.getFullYear(),
  String(yesterday.getMonth() + 1).padStart(2, '0'),
  String(yesterday.getDate()).padStart(2, '0'),
].join('-');

const PENALTY_SEGMENTS = 10;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/** Days after completion (at next midnight) before a completed custom quest is removed. */
const CUSTOM_QUEST_EXPIRE_DAYS: Record<string, number> = {
  easy: 1,
  'easy+': 1,
  medium: 3,
  'medium+': 3,
  hard: 5,
  'hard+': 5,
  sjw: 5,
};

function getExpiresAtForCompletedCustomQuest(difficulty: string | null | undefined): string {
  const days = CUSTOM_QUEST_EXPIRE_DAYS[difficulty?.toLowerCase() ?? 'easy'] ?? 1;
  const nextMidnight = new Date();
  nextMidnight.setHours(24, 0, 0, 0);
  const expiresAt = new Date(nextMidnight.getTime() + (days - 1) * 24 * 60 * 60 * 1000);
  return expiresAt.toISOString();
}

function isCustomQuestDeadlineWithin24h(quest: Quest): boolean {
  if (!quest.deadline_date || quest.completed_at) return false;
  const timeStr = quest.deadline_time ?? '23:59';
  const end = new Date(quest.deadline_date + 'T' + timeStr);
  if (Number.isNaN(end.getTime())) return false;
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return diff > 0 && diff <= TWENTY_FOUR_HOURS_MS;
}

type Quest = {
  id: string;
  name: string;
  category: string;
  xp_reward: number;
  gold_reward: number;
  date: string;
  completed_at: string | null;
  description?: string | null;
  difficulty?: string | null;
  stat_requirement?: string | null;
  /** Custom quests from custom_quests table */
  isCustom?: boolean;
  is_active?: boolean;
  deadline_date?: string;
  deadline_time?: string;
  /** When a custom quest has passed its deadline but remains incomplete. */
  overdue_since?: string | null;
  /** When a completed custom quest should be deleted (tiered by difficulty). */
  expires_at?: string | null;
};

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

function QuestCard({
  quest,
  accentColor,
  playerClass,
  onToggle,
  onOpenDetails,
}: {
  quest: Quest;
  accentColor: string;
  playerClass: keyof typeof CLASS_CONFIG;
  onToggle: (quest: Quest) => void;
  onOpenDetails: (quest: Quest) => void;
}) {
  const isCompleted = !!quest.completed_at;
  const isCustomCompleted = !!quest.isCustom && isCompleted;
  const categoryConfig = CATEGORY_CONFIG[quest.category as keyof typeof CATEGORY_CONFIG];
  const pillColor =
    quest.category === 'class'
      ? accentColor
      : (categoryConfig?.color ?? '#8B5CF6');
  const pillLabel =
    quest.category === 'class'
      ? (CLASS_CONFIG[playerClass]?.label ?? 'CLASS')
      : (categoryConfig?.label ?? quest.category.toUpperCase());

  return (
    <View style={styles.questRow}>
      <Pressable
        onPress={() => {
          if (isCustomCompleted) {
            return;
          }
          onToggle(quest);
        }}
        style={styles.checkboxTouchable}
        hitSlop={8}
        disabled={isCustomCompleted}
      >
        <Text style={styles.checkbox}>{isCompleted ? '✓' : '☐'}</Text>
      </Pressable>
      <Pressable
        style={styles.questCardMain}
        onPress={() => {
          console.log('=== QUEST SELECTED ===');
          try {
            console.log('Quest object:', JSON.stringify(quest, null, 2));
          } catch {
            console.log('Quest object (non-serializable):', quest);
          }
          console.log('Quest type:', typeof quest);
          console.log('Quest keys:', Object.keys(quest));
          console.log('Quest.name:', quest?.name);
          console.log('Quest.description:', quest?.description);
          // Daily/custom quests have category, is_daily, or isCustom; habits have habit_type.
          const isHabit = !!(quest as any).habit_type;
          const isQuest =
            !!(quest as any).quest_type ||
            !!(quest as any).is_daily ||
            !!(quest as any).isCustom ||
            !!((quest as any).category && !isHabit);
          console.log(
            'Is this a habit or quest?',
            isHabit ? 'HABIT' : isQuest ? 'QUEST' : 'UNKNOWN'
          );
          onOpenDetails(quest);
        }}
      >
        <View style={[styles.questRowInner, isCustomCompleted && styles.questRowCompletedFaded]}>
        <View style={styles.questContent}>
          <View style={styles.questHeaderRow}>
            <View style={[styles.categoryPill, { backgroundColor: pillColor }]}>
              <Text style={styles.categoryPillText}>{pillLabel}</Text>
            </View>
            {quest.isCustom && quest.overdue_since && !isCompleted && (
              <View style={styles.overdueBadge}>
                <Text style={styles.overdueBadgeText}>OVERDUE</Text>
              </View>
            )}
          </View>
            <Text
              style={[
                styles.questName,
                isCompleted && styles.questNameCompleted,
              ]}
            >
              {quest.name}
            </Text>
            {isCustomCompleted && (() => {
              const now = new Date();
              const expiresAt = quest.expires_at ? new Date(quest.expires_at) : null;
              let label: string;
              let useBigCountdown = false;
              if (expiresAt && expiresAt.getTime() > now.getTime()) {
                const diffMs = expiresAt.getTime() - now.getTime();
                const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
                label = days <= 1 ? 'Disappears at midnight' : `Disappears in ${days} days`;
                useBigCountdown = true;
              } else {
                const midnight = new Date();
                midnight.setHours(24, 0, 0, 0);
                const diffMs = Math.max(0, midnight.getTime() - now.getTime());
                const hours = Math.floor(diffMs / 3600000);
                const mins = Math.floor((diffMs % 3600000) / 60000);
                const parts: string[] = [];
                if (hours > 0) parts.push(`${hours}h`);
                parts.push(`${mins}m`);
                label = `Disappears in ${parts.join(' ')}`;
              }
              return (
                <Text style={[styles.customQuestTimer, useBigCountdown && styles.customQuestExpiryCountdown]}>
                  {label}
                </Text>
              );
            })()}
          </View>
          <View style={styles.rewardBadges}>
            <View style={styles.xpBadge}>
              <Text style={styles.xpText}>+{quest.xp_reward} XP</Text>
            </View>
            <View style={styles.goldBadge}>
              <Text style={styles.goldText}>+{quest.gold_reward} 🪙</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [questsLoading, setQuestsLoading] = useState(true);
  const [customQuestFormVisible, setCustomQuestFormVisible] = useState(false);
  const [refreshQuestsTrigger, setRefreshQuestsTrigger] = useState(0);
  const [createHabitModalVisible, setCreateHabitModalVisible] = useState(false);
  const [habits, setHabits] = useState<any[]>([]);
  const [confirmingQuestId, setConfirmingQuestId] = useState<string | null>(null);
  const [detailsQuest, setDetailsQuest] = useState<Quest | null>(null);
  const [missedQuestNames, setMissedQuestNames] = useState<string[]>([]);
  const missedQuestPopupShownRef = useRef(false);
  const xp = usePlayerStore((s) => s.xp);
  const level = usePlayerStore((s) => s.level);
  const gold = usePlayerStore((s) => s.gold);
  const rank = usePlayerStore((s) => s.rank);
  const penaltyGauge = usePlayerStore((s) => s.penaltyGauge);
  const isBreakDay = usePlayerStore((s) => s.isBreakDay);
  const lastPenaltyDate = usePlayerStore((s) => s.lastPenaltyDate);
  const todayUncheckedCount = usePlayerStore((s) => s.todayUncheckedCount);
  const playerId = usePlayerStore((s) => s.id);
  const completeQuest = usePlayerStore((s) => s.completeQuest);
  const removeXP = usePlayerStore((s) => s.removeXP);
  const removeGold = usePlayerStore((s) => s.removeGold);
  const applyEndOfDayPenalty = usePlayerStore((s) => s.applyEndOfDayPenalty);
  const setTodayUnchecked = usePlayerStore((s) => s.setTodayUnchecked);
  const levelJustChanged = usePlayerStore((s) => s.levelJustChanged);
  const rankJustChanged = usePlayerStore((s) => s.rankJustChanged);
  const apGained = usePlayerStore((s) => s.apGained);
  const dismissLevelUp = usePlayerStore((s) => s.dismissLevelUp);
  const dismissRankUp = usePlayerStore((s) => s.dismissRankUp);
  const classJustChanged = usePlayerStore((s) => s.classJustChanged);
  const playerClass = usePlayerStore((s) => s.playerClass);
  const accentColor = usePlayerStore((s) => s.accentColor);
  const punishmentTriggered = usePlayerStore((s) => s.punishmentTriggered);
  const dismissPunishment = usePlayerStore((s) => s.dismissPunishment);
  const setPunishmentTriggered = usePlayerStore((s) => s.setPunishmentTriggered);
  const customQuestAttemptsToday = usePlayerStore((s) => s.customQuestAttemptsToday);
  const incrementCustomQuestAttempt = usePlayerStore((s) => s.incrementCustomQuestAttempt);

  const xpCap = level * XP_PER_LEVEL;
  const xpProgressAnim = useRef(new Animated.Value(0)).current;
  const [resetCountdown, setResetCountdown] = useState('');
  const [resetColor, setResetColor] = useState('#737373');
  const [refreshing, setRefreshing] = useState(false);
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const customQuestsAtRisk = quests.filter(
    (q) => q.isCustom && !q.completed_at && isCustomQuestDeadlineWithin24h(q)
  ).length;
  const dailyAtRisk = isBreakDay ? 0 : todayUncheckedCount;
  const [overdueCustomCount, setOverdueCustomCount] = useState(0);
  const atRiskCount = dailyAtRisk + customQuestsAtRisk + overdueCustomCount;
  const totalPenalty = penaltyGauge + atRiskCount;

  // DEV-only helper to reroll today's daily/class quests so you can visually
  // confirm randomness in real time without waiting for a new day.
  const handleDevRerollDailyQuests = async () => {
    if (!playerId) {
      console.log('[DEV REROLL] No playerId, skipping reroll');
      return;
    }
    try {
      console.log('[DEV REROLL] Rerolling daily/class quests for', todayKey);
      setQuestsLoading(true);

      // Delete only today's non-custom quests (daily + class) for this player.
      const { error: deleteError } = await supabase
        .from('quests')
        .delete()
        .eq('player_id', playerId)
        .eq('date', todayKey)
        .neq('category', 'custom');

      if (deleteError) {
        console.log('[DEV REROLL] Delete error:', deleteError.message);
      }

      const {
        stats: currentStats,
        playerClass: currentClass,
        level: currentLevel,
        isBreakDay: currentIsBreakDay,
      } = usePlayerStore.getState();

      const playerName = await getPlayerNameByPlayerId(playerId);
      const questsToInsert = generateDailyQuests(
        playerId,
        currentStats,
        currentClass,
        todayKey,
        currentLevel,
        currentIsBreakDay,
      ).map((q) => ({
        ...q,
        player_name: playerName,
      }));

      const { error: insertError } = await supabase
        .from('quests')
        .insert(questsToInsert);

      if (insertError) {
        console.log('[DEV REROLL] Insert error:', insertError.message);
      } else {
        console.log(
          '[DEV REROLL] Inserted quests:',
          questsToInsert.map((q) => q.name),
        );
      }
    } catch (err) {
      console.log('[DEV REROLL] Unexpected error:', err);
    } finally {
      setQuestsLoading(false);
      setRefreshQuestsTrigger((n) => n + 1);
    }
  };

  // DEV-only helper to simulate moving into the "next day" from the
  // perspective of the daily reset logic. It does this by shifting today's
  // quests back to yesterday's date key so that the next load treats them as
  // "yesterday" and runs the full reset + penalty pipeline again.
  const handleDevSkipDay = async () => {
    if (!playerId) {
      console.log('[DEV SKIP DAY] No playerId, skipping');
      return;
    }
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const authUserId = sessionData?.session?.user?.id ?? null;

      console.log('[DEV SKIP DAY] Shifting today quests to yesterdayKey', {
        playerId,
        todayKey,
        yesterdayKey,
      });

      // Move all of today's quests (including custom) to yesterday's date key.
      const { error: updateError } = await supabase
        .from('quests')
        .update({ date: yesterdayKey })
        .eq('player_id', playerId)
        .eq('date', todayKey);
      if (updateError) {
        console.log('[DEV SKIP DAY] Update error:', updateError.message);
      } else {
        console.log('[DEV SKIP DAY] Updated quests for simulated day skip.');
      }

      // Reset custom quest attempts as if a new day has started.
      const todayIso = new Date().toISOString().slice(0, 10);
      const { error: playerUpdateError } = await supabase
        .from('players')
        .update({
          custom_quest_attempts_today: 0,
          custom_quest_attempts_reset_date: todayIso,
        })
        .eq('id', playerId);
      if (playerUpdateError) {
        console.log('[DEV SKIP DAY] Player attempts reset error:', playerUpdateError.message);
      } else {
        usePlayerStore.setState({
          customQuestAttemptsToday: 0,
          customQuestAttemptsResetDate: todayIso,
        });
      }

      if (authUserId) {
        // Allow positive habits to be logged again: clear last_logged_at.
        const { error: habitsError } = await supabase
          .from('habits')
          .update({ last_logged_at: null })
          .eq('player_id', authUserId);
        if (habitsError) {
          console.log('[DEV SKIP DAY] Habits reset error:', habitsError.message);
        }

        // Simulate 24h passing for custom quests: completed quests get their
        // completed_at shifted back 1 day (so they are treated as older),
        // active quests have deadline_date moved 1 day earlier.
        const { data: customRows, error: customFetchError } = await supabase
          .from('custom_quests')
          .select('*')
          .eq('player_id', authUserId);
        if (customFetchError) {
          console.log('[DEV SKIP DAY] Fetch custom quests error:', customFetchError.message);
        } else if (customRows && customRows.length > 0) {
          for (const row of customRows as any[]) {
            const updates: Record<string, any> = {};

            if (row.completed_at) {
              const d = new Date(row.completed_at as string);
              d.setDate(d.getDate() - 1);
              updates.completed_at = d.toISOString();
            }
            if (row.expires_at) {
              const exp = new Date(row.expires_at as string);
              exp.setDate(exp.getDate() - 1);
              updates.expires_at = exp.toISOString();
            }

            if (row.deadline_date) {
              const [y, m, dStr] = (row.deadline_date as string).split('-').map(Number);
              const d = new Date(y, (m ?? 1) - 1, dStr ?? 1);
              d.setDate(d.getDate() - 1);
              const newY = d.getFullYear();
              const newM = String(d.getMonth() + 1).padStart(2, '0');
              const newD = String(d.getDate()).padStart(2, '0');
              updates.deadline_date = `${newY}-${newM}-${newD}`;
            }

            if (Object.keys(updates).length > 0) {
              const { error: updateCustomError } = await supabase
                .from('custom_quests')
                .update(updates)
                .eq('id', row.id as string);
              if (updateCustomError) {
                console.log('[DEV SKIP DAY] Update custom quest error:', updateCustomError.message);
              }
            }
          }
        }
      }

      // Clear last_penalty_date so the next daily reset run is allowed to
      // apply penalties again for the simulated "yesterday" without being
      // blocked by the duplicate-date guard. This only affects DEV flows.
      const { error: clearPenaltyError } = await supabase
        .from('players')
        .update({ last_penalty_date: null })
        .eq('id', playerId);
      if (clearPenaltyError) {
        console.log('[DEV SKIP DAY] Clear last_penalty_date error:', clearPenaltyError.message);
      } else {
        usePlayerStore.setState({ lastPenaltyDate: null });
      }
    } catch (err) {
      console.log('[DEV SKIP DAY] Unexpected error:', err);
    } finally {
      // Trigger the usual loadQuests flow; it will see no quests for todayKey,
      // read "yesterday" (which now contains what used to be today), apply
      // penalties, delete old quests, and generate a fresh day.
      setRefreshQuestsTrigger((n) => n + 1);
    }
  };

  const confirmingQuest = confirmingQuestId
    ? quests.find((q) => q.id === confirmingQuestId) ?? null
    : null;
  const [nowForCustomTimer, setNowForCustomTimer] = useState(() => new Date());

  useEffect(() => {
    const targetProgress = xpCap > 0 ? xp / xpCap : 0;
    Animated.timing(xpProgressAnim, {
      toValue: targetProgress,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [xp, xpCap, xpProgressAnim]);

  useEffect(() => {
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );

    if (atRiskCount > 0) {
      blink.start();
    } else {
      blink.stop();
      blinkAnim.setValue(1);
    }

    return () => {
      blink.stop();
    };
  }, [atRiskCount, blinkAnim]);

  useEffect(() => {
    if (isBreakDay) {
      setResetCountdown('');
      return;
    }

    const update = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();

      if (diff <= 0) {
        setResetCountdown('00:00:00');
        setResetColor('#DC2626');
        return;
      }

      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);

      const formatted = [
        String(hours).padStart(2, '0'),
        String(mins).padStart(2, '0'),
        String(secs).padStart(2, '0'),
      ].join(':');

      let color = '#737373';
      if (hours <= 2) color = '#D97706';
      if (hours === 0 && mins <= 30) color = '#DC2626';

      setResetCountdown(formatted);
      setResetColor(color);
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [isBreakDay]);

  useEffect(() => {
    const id = setInterval(() => {
      setNowForCustomTimer(new Date());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!playerId) {
      return;
    }

    let isMounted = true;

    const loadQuests = async () => {
      // Reset DEV-only globals used to pipe overdue custom quest info into the
      // penalty logic. This prevents values from accumulating across refreshes.
      (globalThis as any).overdueCustomCount = 0;
      (globalThis as any).overdueCustomNames = [];
      setOverdueCustomCount(0);
      try {
        setQuestsLoading(true);

        const { data, error } = await supabase
          .from('quests')
          .select('*')
          .eq('player_id', playerId)
          .eq('date', todayKey);

        if (error) {
          throw error;
        }

        let rows = data as Quest[] | null;
        let generatedToday = false;
        // Populated before the delete so the penalty block has the real data
        let calculatedUncheckedCount = 0;
        let yesterdayQuestRows: { name: string; completed_at: string | null }[] = [];

        // If no quests for today, clear any leftover older quests and insert generated quests
        if (!rows || rows.length === 0) {
          // Step 1: snapshot yesterday's quests BEFORE deleting them — the delete below
          // erases them, so we must read first or we'll always see 0.
          if (!isBreakDay) {
            const { data: fetchedYesterday } = await supabase
              .from('quests')
              .select('name, completed_at')
              .eq('player_id', playerId)
              .eq('date', yesterdayKey);
            yesterdayQuestRows = fetchedYesterday ?? [];
            calculatedUncheckedCount = yesterdayQuestRows.filter((q) => !q.completed_at).length;
            console.log(
              '[DAILY RESET] Calculated unchecked_quests_count from yesterday:',
              calculatedUncheckedCount,
              '(from', yesterdayQuestRows.length, 'total quests)'
            );
            // Persist the accurate count so any external reads also see it
            if (calculatedUncheckedCount > 0) {
              await supabase
                .from('players')
                .update({ unchecked_quests_count: calculatedUncheckedCount })
                .eq('id', playerId);
            }
          }

          // Step 2: now safe to delete old quests (yesterday snapshot already captured)
          const { error: deleteError } = await supabase
            .from('quests')
            .delete()
            .eq('player_id', playerId)
            .neq('date', todayKey);

          if (deleteError) {
            console.log('Quest cleanup error:', deleteError.message);
          }

          // Step 3: generate and insert today's quests
          const { stats: currentStats, playerClass: currentClass, level: currentLevel, isBreakDay: currentIsBreakDay } = usePlayerStore.getState();
          const playerName = await getPlayerNameByPlayerId(playerId);
          const questsToInsert = generateDailyQuests(playerId, currentStats, currentClass, todayKey, currentLevel, currentIsBreakDay).map((q) => ({
            ...q,
            player_name: playerName,
          }));
          const { data: inserted, error: insertError } = await supabase
            .from('quests')
            .insert(questsToInsert)
            .select('*');

          if (insertError) {
            throw insertError;
          }

          rows = inserted as Quest[];
          generatedToday = true;
          console.log('[DAILY RESET] Daily reset detected — new quests generated for', todayKey);
        } else {
          console.log('[DAILY RESET] Quests already exist for today (' + todayKey + '), no reset needed');
        }

        if (isMounted && rows) {
          const dailyQuests = (rows as Quest[]).filter(
            (q) => q.category !== 'class' && q.category !== 'custom'
          );
          const currentUnchecked = dailyQuests.filter((q) => !q.completed_at).length;
          setTodayUnchecked(currentUnchecked);
          console.log('[DAILY RESET] Daily quests loaded — unchecked today:', currentUnchecked);

        // Fetch custom quests first so we have overdueCustomCount before applying penalties.
        let allQuests: Quest[] = [...(rows as Quest[])];
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const authUserId = sessionData?.session?.user?.id;
          if (authUserId) {
            const { data: customRows } = await supabase
              .from('custom_quests')
              .select('*')
              .eq('player_id', authUserId)
              .eq('is_active', true)
              .order('created_at', { ascending: false });

            const customQuests: Quest[] = (customRows ?? []).map(
              (row: Record<string, unknown>) => ({
                id: row.id as string,
                name: (row.name as string) ?? 'Custom quest',
                category: 'custom',
                xp_reward: (row.xp_reward as number) ?? 0,
                gold_reward: (row.gold_reward as number) ?? 0,
                date: (row.deadline_date as string) ?? todayKey,
                completed_at: (row.completed_at as string | null) ?? null,
                description: (row.description as string) ?? null,
                difficulty: (row.difficulty as string) ?? 'easy',
                isCustom: true,
                is_active: (row.is_active as boolean) ?? true,
                deadline_date: (row.deadline_date as string) ?? undefined,
                deadline_time: (row.deadline_time as string) ?? undefined,
                overdue_since: (row.overdue_since as string | null) ?? null,
                expires_at: (row.expires_at as string | null) ?? null,
              })
            );
            const now = new Date();
            console.log('[CUSTOM QUESTS] Checking missed custom quests —', customQuests.length, 'active custom quests | now:', now.toISOString());
            const pastDeadlineCustom: Quest[] = [];
            const stillActiveCustom: Quest[] = [];
            let overdueCustomCount = 0;
            let overdueCustomNames: string[] = [];
            for (const q of customQuests) {
              if (q.completed_at) {
                const completedDate = q.completed_at.slice(0, 10);
                const expiresAt = q.expires_at ? new Date(q.expires_at) : null;
                const shouldDeleteByExpiry = expiresAt != null && expiresAt.getTime() <= now.getTime();
                const shouldDeleteByLegacy = completedDate < todayKey;
                const shouldDelete = shouldDeleteByExpiry || (shouldDeleteByLegacy && !q.expires_at);
                console.log(
                  '[CUSTOM QUESTS]', q.name,
                  '| completed_at:', q.completed_at,
                  '| expires_at:', q.expires_at ?? '(none)',
                  '| shouldDelete (expiry?', shouldDeleteByExpiry, '| legacy?', shouldDeleteByLegacy, '):', shouldDelete
                );
                if (shouldDelete) {
                  console.log('[CUSTOM QUESTS] Deleted expired completed quest:', q.name);
                  await supabase.from('custom_quests').delete().eq('id', q.id);
                } else {
                  stillActiveCustom.push(q);
                }
                continue;
              }
              const dateStr = q.deadline_date ?? todayKey;
              const timeStr = q.deadline_time ?? '23:59';
              const [h, m] = timeStr.split(':').map(Number);
              // Parse as LOCAL date — new Date("YYYY-MM-DD") parses as UTC midnight,
              // which becomes "yesterday" in UTC-west zones and instantly kills the quest.
              const [year, month, day] = dateStr.split('-').map(Number);
              const end = new Date(year, month - 1, day, h ?? 23, m ?? 59, 0, 0);
              console.log(
                '[CUSTOM QUESTS]', q.name,
                '| deadline_date:', q.deadline_date ?? '(none, using todayKey)',
                '| deadline_time:', q.deadline_time ?? '(none, using 23:59)',
                '| deadline (local):', end.toLocaleString(),
                '| now (local):', now.toLocaleString(),
                '| past deadline?', end.getTime() <= now.getTime()
              );
              if (end.getTime() <= now.getTime()) {
                // Past deadline but not completed: mark as overdue and keep active.
                overdueCustomCount += 1;
                overdueCustomNames.push(q.name);
                if (!q.overdue_since) {
                  console.log('[CUSTOM QUESTS] Marking as OVERDUE:', q.name);
                  await supabase
                    .from('custom_quests')
                    .update({ overdue_since: new Date().toISOString() })
                    .eq('id', q.id);
                } else {
                  console.log('[CUSTOM QUESTS] Already overdue, keeping:', q.name);
                }
                stillActiveCustom.push({ ...q, overdue_since: q.overdue_since ?? new Date().toISOString() });
              } else {
                stillActiveCustom.push(q);
              }
            }
            console.log('[CUSTOM QUESTS] Result — kept:', stillActiveCustom.length, '| deactivated:', pastDeadlineCustom.length);
            ;(globalThis as any).overdueCustomCount = overdueCustomCount;
            ;(globalThis as any).overdueCustomNames = overdueCustomNames;
            allQuests = [...allQuests.filter((q) => q.category !== 'custom'), ...stillActiveCustom];
            if (isMounted) setOverdueCustomCount(overdueCustomCount);
          }
        } catch (e) {
          console.log('Custom quests load error:', e);
        }

          // Apply yesterday's penalty after custom quests are loaded (so overdue count is correct).
          // 1 overdue custom quest = 1 penalty bar (max 1 per quest). Overdue also counts toward "at risk".
          let missedNames: string[] = [];
          console.log('[PENALTY] Checking missed — generatedToday:', generatedToday, '| isBreakDay:', isBreakDay);
          if (generatedToday && !isBreakDay) {
            try {
              const overdueCount = typeof (globalThis as any).overdueCustomCount === 'number' ? (globalThis as any).overdueCustomCount : 0;
              const totalMissed = calculatedUncheckedCount + overdueCount;
              if (totalMissed > 0) {
                console.log(
                  '[PENALTY] Applying — daily:', calculatedUncheckedCount,
                  '| overdue custom:', overdueCount,
                  '| total:', totalMissed,
                  '| date:', yesterdayKey
                );
                applyEndOfDayPenalty(totalMissed, yesterdayKey);
                missedNames = [
                  ...yesterdayQuestRows.filter((q) => !q.completed_at).map((q) => q.name),
                  ...(((globalThis as any).overdueCustomNames as string[]) ?? []),
                ];
                if (missedNames.length > 0) {
                  console.log('[PENALTY] Missed quest names (daily + overdue):', missedNames);
                }
              } else {
                console.log('[PENALTY] No missed quests to penalise (totalMissed = 0)');
              }
              await supabase
                .from('players')
                .update({ unchecked_quests_count: 0 })
                .eq('id', playerId);
              console.log('[PENALTY] Reset unchecked_quests_count to 0 for today');
            } catch (e) {
              console.log('[PENALTY] Error applying end-of-day penalty:', String(e));
            }
          } else if (generatedToday && isBreakDay) {
            console.log('[PENALTY] Skipping penalty — today is a break day');
          }

          // Show missed/overdue popup when we have overdue custom quests even if no daily reset (missedNames was only set above on reset)
          if (missedNames.length === 0) {
            const overdueNames = ((globalThis as any).overdueCustomNames as string[]) ?? [];
            if (overdueNames.length > 0) missedNames = overdueNames;
          }

          // Only trigger punishment when applied penalty gauge hits the limit, not when gauge + at-risk does.
          const stateAfter = usePlayerStore.getState();
          if (stateAfter.penaltyGauge >= PENALTY_SEGMENTS && !stateAfter.punishmentTriggered) {
            setPunishmentTriggered();
          }

          // Allow the missed-quest popup to show once per (real or simulated) new day.
          if (generatedToday) {
            missedQuestPopupShownRef.current = false;
          }
        if (isMounted && missedNames.length > 0 && !missedQuestPopupShownRef.current) {
          setMissedQuestNames(missedNames);
        }

        // Fetch habits (.select('*') includes check_count after migration)
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const authUserId = sessionData?.session?.user?.id;
          if (authUserId) {
            const { data: habitRows } = await supabase
              .from('habits')
              .select('*')
              .eq('player_id', authUserId);
            setHabits(habitRows || []);
          }
        } catch (e) {
          console.log('Habits load error:', e);
        }

        setQuests(allQuests);
        }
      } catch (error: any) {
        console.log('Error loading quests: ' + (error?.message ?? String(error)));
      } finally {
        if (isMounted) {
          setQuestsLoading(false);
        }
      }
    };

    loadQuests();

    return () => {
      isMounted = false;
    };
  }, [playerId, applyEndOfDayPenalty, setTodayUnchecked, isBreakDay, setPunishmentTriggered, refreshQuestsTrigger]);

  const handleCustomQuestCompletion = (quest: Quest) => {
    if (quest.isCustom) {
      if (quest.completed_at) {
        console.log('[CUSTOM QUESTS] Completion tap ignored — quest already completed and locked:', quest.name);
        return;
      }
      setConfirmingQuestId(quest.id);
    } else {
      toggleQuest(quest);
    }
  };

  const toggleQuest = async (quest: Quest) => {
    const isCompleted = !!quest.completed_at;
    const newCompletedAt = isCompleted ? null : new Date().toISOString();

    const updatedQuests = quests.map((q) => {
      if (q.id !== quest.id) return q;
      const next: Quest = { ...q, completed_at: newCompletedAt };
      if (quest.isCustom && newCompletedAt) {
        next.expires_at = getExpiresAtForCompletedCustomQuest(quest.difficulty);
      } else if (quest.isCustom && !newCompletedAt) {
        next.expires_at = null;
      }
      return next;
    });
    setQuests(updatedQuests);

    const dailyQuests = updatedQuests.filter(
      (q) => q.category !== 'class' && q.category !== 'custom'
    );
    const currentUnchecked = dailyQuests.filter((q) => !q.completed_at).length;
    const isDailyQuest = quest.category !== 'class' && quest.category !== 'custom';
    const nextUnchecked = currentUnchecked;

    if (isDailyQuest) {
      setTodayUnchecked(nextUnchecked);

      // Persist snapshot for tomorrow's penalty
      const currentPlayerId = usePlayerStore.getState().id;
      if (currentPlayerId) {
        supabase
          .from('players')
          .update({ unchecked_quests_count: Math.max(0, nextUnchecked) })
          .eq('id', currentPlayerId)
          .then(({ error }) => {
            if (error) console.log('Unchecked quests save error:', error.message);
          });
      }

      // Only trigger punishment when applied penalty gauge hits the limit, not when gauge + at-risk does.
      const stateAfter = usePlayerStore.getState();
      if (stateAfter.penaltyGauge >= PENALTY_SEGMENTS && !stateAfter.punishmentTriggered) {
        setPunishmentTriggered();
      }
    }

    if (!isCompleted) {
      completeQuest(quest.xp_reward, quest.gold_reward);
    } else {
      removeXP(quest.xp_reward);
      removeGold(quest.gold_reward);
    }

    try {
      if (quest.isCustom) {
        const updates: { completed_at: string | null; expires_at?: string | null } = {
          completed_at: newCompletedAt,
        };
        if (newCompletedAt) {
          updates.expires_at = getExpiresAtForCompletedCustomQuest(quest.difficulty);
          console.log('[CUSTOM QUESTS] Completed quest expires in', CUSTOM_QUEST_EXPIRE_DAYS[quest.difficulty?.toLowerCase() ?? 'easy'] ?? 1, 'days');
        } else {
          updates.expires_at = null;
        }
        const { error: customError } = await supabase
          .from('custom_quests')
          .update(updates)
          .eq('id', quest.id);

        if (customError) throw customError;
      } else {
        const { error } = await supabase
          .from('quests')
          .update({ completed_at: newCompletedAt })
          .eq('id', quest.id);

        if (error) throw error;
      }
    } catch (error: any) {
      console.log('Error updating quest: ' + (error?.message ?? String(error)));
    }
  };

  return (
    <View style={[styles.outer, isWeb && styles.outerWeb]}>
      <View style={[styles.container, isWeb && styles.containerWeb]}>
        <StatusBar style="light" />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                setRefreshQuestsTrigger((n) => n + 1);
                setTimeout(() => setRefreshing(false), 1500);
              }}
              tintColor="#8B5CF6"
            />
          }
        >
          <View style={styles.dateCard}>
            <Text style={styles.dateText}>{dateString}</Text>
          </View>
          {isBreakDay && (
            <View style={styles.restDayBanner}>
              <Text style={styles.restDayBannerTitle}>🌿 REST DAY</Text>
              <Text style={styles.restDayBannerSubtext}>
                Penalty gauge frozen. Complete quests for bonus rewards.
              </Text>
            </View>
          )}
          <View style={styles.resetRow}>
            {isBreakDay ? (
              <Text style={[styles.resetText, styles.resetRestText]}>
                REST DAY · No penalties today
              </Text>
            ) : (
              <Text style={[styles.resetText, { color: resetColor }]}>
                {resetCountdown ? `Resets in  ${resetCountdown}` : 'Calculating reset...'}
              </Text>
            )}
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
              {xp} / {xpCap} XP
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statText}>LEVEL {level}</Text>
            <View style={styles.rankBadge}>
              <Text style={styles.rankBadgeText}>{rank}-RANK</Text>
            </View>
            <Text style={styles.statText}>{gold} 🪙</Text>
          </View>
          <View style={styles.questList}>
          {questsLoading ? (
            <Text style={styles.loadingText}>
              The System is preparing your quests...
            </Text>
          ) : (
            <>
              <View style={styles.questSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeader}>DAILY QUESTS</Text>
                  {__DEV__ && (
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <Pressable
                        onPress={handleDevSkipDay}
                        style={styles.devRerollButton}
                      >
                        <Text style={styles.devRerollText}>+1 DAY</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleDevRerollDailyQuests}
                        style={styles.devRerollButton}
                      >
                        <Text style={styles.devRerollText}>↻ REROLL</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
                <View style={styles.sectionDivider} />
                {quests
                  .filter((q) => q.category !== 'class' && q.category !== 'custom')
                  .map((quest) => (
                    <QuestCard
                      key={quest.id}
                      quest={quest}
                      accentColor={accentColor}
                      playerClass={playerClass}
                      onToggle={toggleQuest}
                      onOpenDetails={setDetailsQuest}
                    />
                  ))}
              </View>

              {playerClass !== 'unclassed' && (
                <View style={styles.questSection}>
                  <Text style={styles.sectionHeader}>CLASS QUEST</Text>
                  <View style={styles.sectionDivider} />
                  {                  quests
                    .filter((q) => q.category === 'class')
                    .map((quest) => (
                      <QuestCard
                        key={quest.id}
                        quest={quest}
                        accentColor={accentColor}
                        playerClass={playerClass}
                        onToggle={toggleQuest}
                        onOpenDetails={setDetailsQuest}
                      />
                    ))}
                </View>
              )}

              <View style={styles.questSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeader}>CUSTOM QUESTS</Text>
                  <Pressable
                    onPress={() => setCustomQuestFormVisible(true)}
                    disabled={quests.filter((q) => q.category === 'custom').length >= 5 || customQuestAttemptsToday >= CUSTOM_QUEST_ATTEMPTS_PER_DAY}
                    style={[
                      styles.createQuestBtn,
                      (quests.filter((q) => q.category === 'custom').length >= 5 || customQuestAttemptsToday >= CUSTOM_QUEST_ATTEMPTS_PER_DAY) && styles.createQuestBtnDisabled,
                    ]}
                  >
                    <Text style={styles.createQuestBtnText}>+ NEW</Text>
                  </Pressable>
                </View>
                <View style={styles.sectionDivider} />
                {quests.filter((q) => q.category === 'custom').length === 0 ? (
                  <Text style={styles.emptySectionText}>
                    No custom quests yet. Create one to harness the power of AI evaluation.
                  </Text>
                ) : (
                  quests
                    .filter((q) => q.category === 'custom')
                    .map((quest) => (
                      <QuestCard
                        key={quest.id}
                        quest={quest}
                        accentColor={accentColor}
                        playerClass={playerClass}
                        onToggle={handleCustomQuestCompletion}
                        onOpenDetails={setDetailsQuest}
                      />
                    ))
                )}
              </View>

              <HabitsCard
                habits={habits}
                onHabitLogged={() => setRefreshQuestsTrigger((n) => n + 1)}
                onHabitDeleted={(id) => {
                  setHabits((prev) => prev.filter((h) => h.id !== id));
                }}
                onAddHabitPress={() => {
                  console.log('Create habit button clicked');
                  setCreateHabitModalVisible(true);
                }}
              />

              <CustomQuestForm
                visible={customQuestFormVisible}
                onClose={() => setCustomQuestFormVisible(false)}
                onQuestCreated={() => {
                  incrementCustomQuestAttempt();
                  setRefreshQuestsTrigger((n) => n + 1);
                }}
                attemptCount={customQuestAttemptsToday}
                maxAttemptsPerDay={CUSTOM_QUEST_ATTEMPTS_PER_DAY}
              />

              <CreateHabitModal
                visible={createHabitModalVisible}
                onClose={() => setCreateHabitModalVisible(false)}
                onHabitCreated={() => setRefreshQuestsTrigger((n) => n + 1)}
              />
            </>
          )}
          </View>
          <View style={styles.penaltySection}>
            <Text
              style={[
                styles.penaltyLabel,
                totalPenalty >= 8
                  ? { color: '#DC2626' }
                  : totalPenalty >= 5
                    ? { color: '#D97706' }
                    : null,
              ]}
            >
              PENALTY GAUGE  ·  {totalPenalty}/10
            </Text>
            <View style={styles.penaltyRow}>
              {Array.from({ length: PENALTY_SEGMENTS }, (_, i) => {
                if (isBreakDay) {
                  return (
                    <View
                      key={i}
                      style={[
                        styles.penaltySegment,
                        i < totalPenalty && styles.penaltySegmentFrozen,
                      ]}
                    />
                  );
                }

                if (i < penaltyGauge) {
                  return (
                    <View
                      key={i}
                      style={[styles.penaltySegment, styles.penaltySegmentFilled]}
                    />
                  );
                }

                if (i < totalPenalty) {
                  return (
                    <Animated.View
                      key={i}
                      style={[
                        styles.penaltySegment,
                        styles.penaltySegmentAtRisk,
                        { opacity: blinkAnim },
                      ]}
                    />
                  );
                }

                return <View key={i} style={styles.penaltySegment} />;
              })}
            </View>
            <View style={{ marginTop: 8, alignItems: 'center' }}>
              <Text style={styles.penaltyDetailText}>
                <Text style={{ color: '#DC2626' }}>{penaltyGauge}</Text>
                <Text style={{ color: '#737373' }}> accumulated · </Text>
                <Text style={{ color: '#D97706' }}>{atRiskCount}</Text>
                <Text style={{ color: '#737373' }}> at risk today</Text>
              </Text>
              <Text
                style={[
                  styles.penaltyTotalText,
                  totalPenalty >= 8 && { color: '#DC2626', fontWeight: '700' },
                ]}
              >
                Total: {totalPenalty} / 10
              </Text>
            </View>
          </View>
        </ScrollView>

        <LevelUpModal
          visible={levelJustChanged || rankJustChanged}
          onDismiss={() => {
            dismissLevelUp();
            dismissRankUp();
          }}
          level={level}
          levelJustChanged={levelJustChanged}
          classJustChanged={classJustChanged}
          className={CLASS_CONFIG[playerClass].label}
          accentColor={accentColor}
          rankChanged={rankJustChanged}
          newRank={rank}
          apGained={apGained}
        />
        <PunishmentModal
          visible={punishmentTriggered}
          onAccept={dismissPunishment}
        />

        <MissedQuestNotification
          visible={missedQuestNames.length > 0}
          questNames={missedQuestNames}
          onDismiss={() => {
            missedQuestPopupShownRef.current = true;
            setMissedQuestNames([]);
          }}
        />

        <QuestDetailsModal
          visible={detailsQuest !== null}
          quest={detailsQuest}
          accentColor={accentColor}
          playerClass={playerClass}
          onClose={() => setDetailsQuest(null)}
          onDelete={
            detailsQuest?.isCustom && !detailsQuest?.completed_at
              ? async (questId) => {
                  console.log('Delete custom quest clicked:', questId);
                  const { error } = await supabase.from('custom_quests').delete().eq('id', questId);
                  if (error) {
                    console.error('Custom quest delete error:', error);
                    return;
                  }
                  setQuests((prev) => prev.filter((q) => q.id !== questId));
                  setDetailsQuest(null);
                  useToastStore.getState().addToast('Quest deleted');
                }
              : undefined
          }
        />

        <Modal visible={confirmingQuestId !== null} transparent animationType="fade">
          <View style={styles.confirmationOverlay}>
            <View style={styles.confirmationBox}>
              <Text style={styles.confirmationTitle}>Confirm Completion?</Text>
              <Text style={styles.confirmationSubtext}>
                This quest will be removed in{' '}
                {confirmingQuest?.difficulty === 'easy' || confirmingQuest?.difficulty === 'easy+'
                  ? '1 day'
                  : confirmingQuest?.difficulty === 'medium' || confirmingQuest?.difficulty === 'medium+'
                    ? '3 days'
                    : '1 week'}{' '}
                at {confirmingQuest?.deadline_time ?? '23:59'}.
              </Text>
              <View style={styles.confirmationButtons}>
                <Pressable
                  onPress={() => setConfirmingQuestId(null)}
                  style={styles.confirmationCancel}
                >
                  <Text style={styles.confirmationButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    if (confirmingQuest) toggleQuest(confirmingQuest);
                    setConfirmingQuestId(null);
                  }}
                  style={styles.confirmationProceed}
                >
                  <Text style={styles.confirmationButtonTextProceed}>Proceed</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
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
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  containerWeb: {
    maxWidth: 390,
    width: '100%',
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
  restDayBanner: {
    backgroundColor: '#1A2E1A',
    borderWidth: 1,
    borderColor: '#16A34A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  restDayBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16A34A',
    textAlign: 'center',
    marginBottom: 4,
  },
  restDayBannerSubtext: {
    fontSize: 12,
    color: '#737373',
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
    gap: 20,
    marginBottom: 24,
  },
  questSection: {
    gap: 12,
  },
  questHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: '#737373',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  devRerollButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#4B5563',
    backgroundColor: '#111827',
  },
  devRerollText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  createQuestBtn: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  createQuestBtnDisabled: {
    opacity: 0.5,
  },
  createQuestBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#2A2A2A',
    marginBottom: 12,
  },
  emptySectionText: {
    fontSize: 14,
    color: '#737373',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  loadingText: {
    fontSize: 14,
    color: '#A3A3A3',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  questRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxTouchable: {
    paddingVertical: 16,
    paddingRight: 6,
  },
  checkbox: {
    fontSize: 22,
    color: '#8B5CF6',
    width: 28,
    textAlign: 'center',
  },
  questCardMain: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
  },
  questRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  questRowCompletedFaded: {
    opacity: 0.75,
    backgroundColor: '#151515',
  },
  questContent: {
    flex: 1,
    gap: 6,
  },
  questExpanded: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    gap: 10,
  },
  questDescription: {
    fontSize: 13,
    color: '#737373',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  expandedBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  difficultyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  statReqText: {
    fontSize: 12,
    color: '#737373',
  },
  categoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  questName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  questNameCompleted: {
    color: '#737373',
    textDecorationLine: 'line-through',
  },
  customQuestTimer: {
    fontSize: 11,
    color: '#D4D4D4',
    marginTop: 2,
  },
  customQuestExpiryCountdown: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E5E7EB',
  },
  rewardBadges: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
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
  goldBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  goldText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  overdueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#7F1D1D',
    marginLeft: 8,
  },
  overdueBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FCA5A5',
    letterSpacing: 0.5,
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
    width: 30,
    height: 32,
    backgroundColor: '#1A1A1A',
    borderRadius: 6,
  },
  penaltySegmentFilled: {
    backgroundColor: '#DC2626',
  },
  penaltySegmentFrozen: {
    backgroundColor: '#2563EB',
  },
  resetRow: {
    marginBottom: 16,
    alignItems: 'center',
  },
  resetText: {
    fontSize: 12,
    color: '#737373',
  },
  resetRestText: {
    color: '#16A34A',
  },
  penaltyDetailText: {
    fontSize: 11,
    color: '#737373',
  },
  penaltyTotalText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  penaltySegmentAtRisk: {
    backgroundColor: '#D97706',
  },
  confirmationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmationBox: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  confirmationSubtext: {
    fontSize: 14,
    color: '#D1D5DB',
    marginBottom: 16,
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  confirmationCancel: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  confirmationProceed: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#8B5CF6',
  },
  confirmationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E7EB',
  },
  confirmationButtonTextProceed: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
