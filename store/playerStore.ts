import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { supabaseWrite } from '../lib/supabaseErrorHandler';
import {
  type PlayerClass,
  type CombatStats,
  detectClass,
  calculateCombatStats,
  CLASS_CONFIG,
  getTotalAP,
  getSpentAP,
} from '../lib/classEngine';
import { RANK_THRESHOLDS } from '../lib/rankEngine';
import { STAT_THRESHOLDS } from '../lib/questConfig';

export const XP_PER_LEVEL = 500;
export const HABIT_REWARD_PER_LEVEL = 10;
export const CUSTOM_QUEST_ATTEMPTS_PER_DAY = 5;
const PENALTY_MAX = 10;
const CLASS_CHANGED_BANNER_MS = 3000;

export interface PlayerStats {
  str: number;
  agi: number;
  int: number;
  vit: number;
  endurance: number;
}

interface PlayerState {
  id: string | null;
  name: string;
  level: number;
  xp: number;
  rankXp: number;
  rank: string;
  gold: number;
  penaltyGauge: number;
  lastPenaltyDate: string | null;
  punishmentTriggered: boolean;
  todayUncheckedCount: number;
  breakDays: number[];
  isBreakDay: boolean;
  lastBreakDayChange: string | null;
  breakDayChangeBlocked: boolean;
  stats: PlayerStats;
  ap: number;
  playerClass: PlayerClass;
  accentColor: string;
  combatStats: CombatStats;
  currentHP: number;
  currentMP: number;
  currentStamina: number;
  classJustChanged: boolean;
  classChangeModal: { previousClass: PlayerClass; newClass: PlayerClass } | null;
  levelJustChanged: boolean;
  rankJustChanged: boolean;
  rankDemoted: boolean;
  apGained: number;
  thresholdAlert: { stat: string; value: number; message: string; quests: string[] } | null;
  resetRequested: boolean;
  resetBannerVisible: boolean;
  customQuestAttemptsToday: number;
  customQuestAttemptsResetDate: string | null;
  setBreakDays: (days: number[]) => void;
  incrementCustomQuestAttempt: () => void;
  requestReset: () => void;
  cancelReset: () => void;
  dismissLevelUp: () => void;
  dismissThresholdAlert: () => void;
  dismissClassChangeModal: () => void;
  dismissRankUp: () => void;
  dismissRankDemotion: () => void;
  dismissPunishment: () => void;
  setPunishmentTriggered: () => void;
  addXP: (amount: number, persist?: boolean) => void;
  loadPlayer: (player: {
    id: string;
    name: string;
    level: number;
    xp: number;
    rankXp: number;
    rank: string;
    gold: number;
    penaltyGauge: number;
    breakDays?: number[];
    lastBreakDayChange?: string | null;
    lastPenaltyDate?: string | null;
    punishmentTriggered?: boolean;
    stats: PlayerStats;
    ap?: number;
    playerClass?: PlayerClass;
    customQuestAttemptsToday?: number;
    customQuestAttemptsResetDate?: string | null;
  }) => void;
  setName: (name: string) => void;
  allocateAP: (stat: keyof PlayerStats) => void;
  removeXP: (amount: number) => void;
  removeGold: (amount: number) => void;
  restoreHP: (amount: number) => void;
  restoreMP: (amount: number) => void;
  restoreStamina: (amount: number) => void;
  completeQuest: (xpReward: number, goldReward: number) => void;
  increasePenalty: () => void;
  resetPenalty: () => void;
  setPenaltyGauge: (value: number) => void;
  applyEndOfDayPenalty: (missedCount: number, date: string) => void;
  setTodayUnchecked: (n: number) => void;
  resetStats: () => void;
  resetToDefaults: () => void;
}

function getXpMax(level: number) {
  return level * XP_PER_LEVEL;
}

function getWeekMonday(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

const defaultCombatStats: CombatStats = {
  hp: 100,
  atk: 10,
  mp: 10,
  sta: 10,
  def: 5,
  spd: 10,
  dodge: 0,
  crit_chance: 0,
  crit_dmg: 0,
};

function applyXpDelta(
  currentXp: number,
  currentLevel: number,
  currentRankXp: number,
  currentRank: string,
  currentStats: PlayerStats,
  delta: number
): {
  xp: number;
  level: number;
  rankXp: number;
  rank: string;
  ap: number;
  levelChanged: boolean;
  rankChanged: boolean;
  apGained: number;
} {
  let remainingXP = currentXp + delta;
  let newLevel = currentLevel;
  const MAX_LEVEL_ITERATIONS = 100;
  let iterations = 0;

  if (delta >= 0) {
    while (
      remainingXP >= newLevel * XP_PER_LEVEL &&
      iterations < MAX_LEVEL_ITERATIONS
    ) {
      remainingXP -= newLevel * XP_PER_LEVEL;
      newLevel += 1;
      iterations += 1;
    }
  } else {
    while (
      remainingXP < 0 &&
      newLevel > 1 &&
      iterations < MAX_LEVEL_ITERATIONS
    ) {
      newLevel -= 1;
      remainingXP += newLevel * XP_PER_LEVEL;
      iterations += 1;
    }
    if (newLevel <= 1) {
      remainingXP = Math.max(0, remainingXP);
      newLevel = 1;
    }
  }

  const oldAp = getTotalAP(currentLevel) - getSpentAP(currentStats);
  const newAp = getTotalAP(newLevel) - getSpentAP(currentStats);
  const apGained = newAp - oldAp;

  let nextRankXp = currentRankXp + delta;
  let nextRank = currentRank;

  if (delta >= 0) {
    const threshold = RANK_THRESHOLDS[currentRank];
    if (threshold?.next && nextRankXp >= threshold.max) {
      nextRank = threshold.next;
    }
  } else {
    nextRankXp = Math.max(0, nextRankXp);
    const currentThreshold = RANK_THRESHOLDS[currentRank];
    if (currentThreshold && nextRankXp < currentThreshold.min) {
      for (const [rankKey, threshold] of Object.entries(RANK_THRESHOLDS)) {
        const inRange =
          threshold.next === null
            ? nextRankXp >= threshold.min && nextRankXp <= threshold.max
            : nextRankXp >= threshold.min && nextRankXp < threshold.max;
        if (inRange) {
          nextRank = rankKey;
          break;
        }
      }
    }
  }

  const levelChanged = newLevel !== currentLevel;
  const rankChanged = nextRank !== currentRank;

  if (delta > 0 && levelChanged) {
    console.log(`Level up! Now level ${newLevel}, +${apGained} AP`);
  }
  if (delta < 0 && rankChanged) {
    console.log(`Rank changed to ${nextRank}`);
  }

  return {
    xp: remainingXP,
    level: newLevel,
    rankXp: nextRankXp,
    rank: nextRank,
    ap: newAp,
    levelChanged,
    rankChanged,
    apGained,
  };
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  id: null,
  name: 'Hunter',
  level: 1,
  xp: 0,
  rankXp: 0,
  rank: 'E',
  gold: 0,
  penaltyGauge: 0,
  lastPenaltyDate: null,
  punishmentTriggered: false,
  breakDays: [],
  isBreakDay: false,
  lastBreakDayChange: null,
  breakDayChangeBlocked: false,
  stats: { str: 10, agi: 10, int: 10, vit: 10, endurance: 10 },
  ap: 5,
  playerClass: 'unclassed',
  accentColor: '#8B5CF6',
  combatStats: defaultCombatStats,
  currentHP: 100,
  currentMP: 10,
  currentStamina: 10,
  classJustChanged: false,
  classChangeModal: null,
  levelJustChanged: false,
  rankJustChanged: false,
  rankDemoted: false,
  apGained: 0,
  thresholdAlert: null,
  resetRequested: false,
  resetBannerVisible: false,
  todayUncheckedCount: 0,
  customQuestAttemptsToday: 0,
  customQuestAttemptsResetDate: null,

  requestReset() {
    set({ resetRequested: true });
  },

  cancelReset() {
    set({ resetRequested: false });
  },

  resetToDefaults() {
    set({
      id: null,
      name: 'Hunter',
      level: 1,
      xp: 0,
      rankXp: 0,
      rank: 'E',
      gold: 0,
      penaltyGauge: 0,
      lastPenaltyDate: null,
      punishmentTriggered: false,
      breakDays: [],
      isBreakDay: false,
      lastBreakDayChange: null,
      breakDayChangeBlocked: false,
      stats: { str: 10, agi: 10, int: 10, vit: 10, endurance: 10 },
      ap: 5,
      playerClass: 'unclassed',
      accentColor: '#8B5CF6',
      combatStats: defaultCombatStats,
      currentHP: 100,
      currentMP: 10,
      currentStamina: 10,
      classJustChanged: false,
      classChangeModal: null,
      levelJustChanged: false,
      rankJustChanged: false,
      rankDemoted: false,
      apGained: 0,
      thresholdAlert: null,
      resetRequested: false,
      resetBannerVisible: false,
      todayUncheckedCount: 0,
      customQuestAttemptsToday: 0,
      customQuestAttemptsResetDate: null,
    });
    console.log('Store reset complete');
  },

  dismissLevelUp() {
    set({ levelJustChanged: false, apGained: 0 });
  },

  dismissRankUp() {
    set({ rankJustChanged: false, apGained: 0 });
  },

  dismissThresholdAlert() {
    set({ thresholdAlert: null });
  },

  dismissClassChangeModal() {
    set({ classChangeModal: null, classJustChanged: false });
  },

  dismissRankDemotion() {
    set({ rankDemoted: false });
  },

  dismissPunishment() {
    set((state) => {
      if (state.id) {
        supabaseWrite(
          supabase
            .from('players')
            .update({
              penalty_gauge: 0,
              punishment_triggered: false,
            })
            .eq('id', state.id) as any,
          'Penalty save error'
        );
      }
      return { punishmentTriggered: false, penaltyGauge: 0 };
    });
  },

  setPunishmentTriggered() {
    set((state) => {
      if (state.id && !state.punishmentTriggered) {
        supabaseWrite(
          supabase
            .from('players')
            .update({
              punishment_triggered: true,
            })
            .eq('id', state.id) as any,
          'Penalty save error'
        );
      }
      return { punishmentTriggered: true };
    });
  },

  loadPlayer(player) {
    const playerClass = player.playerClass ?? 'unclassed';
    const combatStats = calculateCombatStats(player.stats, playerClass);
    const accentColor = CLASS_CONFIG[playerClass].color;
    const ap = getTotalAP(player.level) - getSpentAP(player.stats);
    const breakDays = player.breakDays ?? [];
    const lastBreakDayChange = player.lastBreakDayChange ?? null;
    const todayDayNumber = new Date().getDay();
    const isBreakDay = breakDays.includes(todayDayNumber);
    const lastPenaltyDate = player.lastPenaltyDate ?? null;
    const punishmentTriggered = player.punishmentTriggered ?? false;
    const customQuestAttemptsToday = player.customQuestAttemptsToday ?? 0;
    const customQuestAttemptsResetDate = player.customQuestAttemptsResetDate ?? null;
    set(() => ({
      id: player.id,
      name: player.name,
      level: player.level,
      xp: player.xp,
      rankXp: player.rankXp,
      rank: player.rank,
      gold: player.gold,
      penaltyGauge: player.penaltyGauge,
      breakDays,
      isBreakDay,
      lastBreakDayChange,
      lastPenaltyDate,
      punishmentTriggered,
      todayUncheckedCount: 0,
      stats: player.stats,
      ap,
      apGained: 0,
      playerClass,
      accentColor,
      combatStats,
      currentHP: combatStats.hp,
      currentMP: combatStats.mp,
      currentStamina: combatStats.sta,
      customQuestAttemptsToday,
      customQuestAttemptsResetDate,
    }));
  },

  incrementCustomQuestAttempt() {
    set((state) => {
      const next = Math.min(state.customQuestAttemptsToday + 1, CUSTOM_QUEST_ATTEMPTS_PER_DAY);
      const todayIso = new Date().toISOString().slice(0, 10);
      if (state.id) {
        supabaseWrite(
          supabase
            .from('players')
            .update({
              custom_quest_attempts_today: next,
              custom_quest_attempts_reset_date: todayIso,
            })
            .eq('id', state.id) as any,
          'Custom quest attempts save error'
        );
      }
      return {
        customQuestAttemptsToday: next,
        customQuestAttemptsResetDate: todayIso,
      };
    });
  },

  setBreakDays(days) {
    const state = get();
    const lastChange = state.lastBreakDayChange;
    if (lastChange) {
      const lastMonday = getWeekMonday(lastChange);
      const todayIso = new Date().toISOString().slice(0, 10);
      const thisMonday = getWeekMonday(todayIso);
      if (lastMonday === thisMonday) {
        set({ breakDayChangeBlocked: true });
        setTimeout(() => usePlayerStore.setState({ breakDayChangeBlocked: false }), 3000);
        return;
      }
    }
    const todayDayNumber = new Date().getDay();
    const isBreakDay = days.includes(todayDayNumber);
    const todayIso = new Date().toISOString().slice(0, 10);
    set({ breakDays: days, isBreakDay, lastBreakDayChange: todayIso });
    const next = get();
    if (next.id) {
      supabaseWrite(
        supabase
          .from('players')
          .update({ break_days: days, last_break_day_change: todayIso })
          .eq('id', next.id) as any,
        'Break days save error'
      );
    }
    console.log('Break days updated: ' + days);
  },

  setName(name) {
    set({ name });
    const state = get();
    if (state.id) {
      supabaseWrite(
        supabase
          .from('players')
          .update({ name })
          .eq('id', state.id) as any,
        'Name save error'
      );
    }
  },

  allocateAP(stat) {
    const state = get();
    const availableAp = getTotalAP(state.level) - getSpentAP(state.stats);
    if (availableAp <= 0) return;

    const newStats = { ...state.stats, [stat]: state.stats[stat] + 1 };
    const newStatValue = newStats[stat];
    const newClass = detectClass(newStats, state.level);
    const combatStats = calculateCombatStats(newStats, newClass);
    const accentColor = CLASS_CONFIG[newClass].color;
    const classJustChanged = newClass !== state.playerClass;
    const newAp = getTotalAP(state.level) - getSpentAP(newStats);

    const thresholds = STAT_THRESHOLDS[stat] ?? [];
    const crossed = thresholds.find((t) => t.value === newStatValue);

    set({
      ap: newAp,
      stats: newStats,
      playerClass: newClass,
      accentColor,
      combatStats,
      currentHP: combatStats.hp,
      currentMP: combatStats.mp,
      currentStamina: combatStats.sta,
      classJustChanged,
      ...(crossed
        ? { thresholdAlert: { stat, value: newStatValue, message: crossed.message, quests: crossed.quests } }
        : {}),
    });

    if (classJustChanged) {
      set((s) => ({ ...s, classChangeModal: { previousClass: state.playerClass, newClass } }));
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        import('../lib/specialQuestEngine').then(({ checkAndUpdateSpecialQuests }) => {
          if (stat === 'str') checkAndUpdateSpecialQuests(user.id, 'stat_strength', newStats.str);
          if (stat === 'agi') checkAndUpdateSpecialQuests(user.id, 'stat_agility', newStats.agi);
        });
      }
    });

    if (state.id) {
      supabaseWrite(
        supabase
          .from('players')
          .update({
            str: newStats.str,
            agi: newStats.agi,
            int: newStats.int,
            vit: newStats.vit,
            endurance: newStats.endurance,
            ap: newAp,
            player_class: newClass,
            combat_hp: combatStats.hp,
            combat_atk: combatStats.atk,
            combat_mp: combatStats.mp,
            combat_sta: combatStats.sta,
            combat_def: combatStats.def,
            combat_spd: combatStats.spd,
            combat_dodge: combatStats.dodge,
            combat_crit_chance: combatStats.crit_chance,
            combat_crit_dmg: combatStats.crit_dmg,
          })
          .eq('id', state.id) as any,
        'Player update error'
      );
    }
  },

  addXP(amount, persist = true) {
    set((state) => {
      const {
        xp,
        level,
        rankXp,
        rank,
        ap,
        levelChanged,
        rankChanged,
        apGained,
      } = applyXpDelta(
        state.xp,
        state.level,
        state.rankXp,
        state.rank,
        state.stats,
        amount
      );

      if (persist && state.id) {
        supabaseWrite(
          supabase
            .from('players')
            .update({
              xp,
              level,
              gold: state.gold,
              rank,
              rank_xp: rankXp,
              ap,
            })
            .eq('id', state.id) as any,
          'Player update error'
        );
      }

      if (levelChanged && state.id) {
        import('../lib/specialQuestEngine').then(({ checkAndUpdateSpecialQuests }) => {
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) checkAndUpdateSpecialQuests(user.id, 'level_reach', level);
          });
        });
      }

      return {
        xp,
        rankXp,
        level,
        ap,
        apGained,
        rank,
        levelJustChanged: levelChanged,
        rankJustChanged: rankChanged,
      };
    });
  },

  removeXP(amount) {
    set((state) => {
      const {
        xp,
        level,
        rankXp,
        rank,
        ap,
        rankChanged,
      } = applyXpDelta(
        state.xp,
        state.level,
        state.rankXp,
        state.rank,
        state.stats,
        -amount
      );
      const didRankDemote = rankChanged;

      if (state.id) {
        supabaseWrite(
          supabase
            .from('players')
            .update({
              xp,
              level,
              gold: state.gold,
              rank,
              rank_xp: rankXp,
              ap,
            })
            .eq('id', state.id) as any,
          'Player update error'
        );
      }

      return {
        xp,
        rankXp,
        level,
        ap,
        rank,
        rankDemoted: didRankDemote,
      };
    });
  },

  removeGold(amount) {
    set((state) => ({ gold: Math.max(0, state.gold - amount) }));
  },

  restoreHP(amount) {
    const delta = Math.max(0, amount);
    set((state) => ({
      currentHP: Math.min(state.combatStats.hp, state.currentHP + delta),
    }));
  },

  restoreMP(amount) {
    const delta = Math.max(0, amount);
    set((state) => ({
      currentMP: Math.min(state.combatStats.mp, state.currentMP + delta),
    }));
  },

  restoreStamina(amount) {
    const delta = Math.max(0, amount);
    set((state) => ({
      currentStamina: Math.min(state.combatStats.sta, state.currentStamina + delta),
    }));
  },

  completeQuest(xpReward, goldReward) {
    set((state) => {
      const {
        xp,
        level,
        rankXp,
        rank,
        ap,
        levelChanged,
        rankChanged,
        apGained,
      } = applyXpDelta(
        state.xp,
        state.level,
        state.rankXp,
        state.rank,
        state.stats,
        xpReward
      );
      const nextGold = state.gold + goldReward;

      if (state.id) {
        supabase
          .from('players')
          .update({
            xp,
            level,
            gold: nextGold,
            rank,
            rank_xp: rankXp,
            ap,
          })
          .eq('id', state.id)
          .then(({ error }) => {
            if (error) {
              console.log('Player update error:', error.message);
            } else {
              console.log('Player saved to Supabase ✓');
            }
          });
      }

      return {
        gold: nextGold,
        xp,
        rankXp,
        level,
        ap,
        apGained,
        rank,
        levelJustChanged: levelChanged,
        rankJustChanged: rankChanged,
      };
    });
  },

  increasePenalty() {
    set((state) => {
      const newValue = Math.min(state.penaltyGauge + 1, PENALTY_MAX);
      if (state.id) {
        supabaseWrite(
          supabase
            .from('players')
            .update({ penalty_gauge: newValue })
            .eq('id', state.id) as any,
          'Penalty save error'
        );
      }
      return { penaltyGauge: newValue };
    });
  },

  resetPenalty() {
    set({ penaltyGauge: 0 });
  },

  setPenaltyGauge(value) {
    const newValue = Math.max(0, Math.min(value, PENALTY_MAX));
    set({ penaltyGauge: newValue });
    const state = get();
    if (state.id) {
      supabaseWrite(
        supabase
          .from('players')
          .update({ penalty_gauge: newValue })
          .eq('id', state.id) as any,
        'Penalty save error'
      );
    }
  },

  applyEndOfDayPenalty(missedCount, date) {
    console.log('[PENALTY] applyEndOfDayPenalty called — missedCount:', missedCount, '| date:', date);
    if (!date) {
      console.log('[PENALTY] skipped: date is falsy');
      return;
    }
    const state = get();
    console.log('[PENALTY] isBreakDay:', state.isBreakDay, '| lastPenaltyDate:', state.lastPenaltyDate, '| penaltyGauge:', state.penaltyGauge);
    if (state.isBreakDay) {
      console.log('[PENALTY] skipped: today is a break day');
      return;
    }
    set((s) => {
      if (s.lastPenaltyDate === date) {
        console.log('[PENALTY] skipped: penalty already applied for date', date, '(lastPenaltyDate matches)');
        return {};
      }
      if (missedCount <= 0) {
        console.log('[PENALTY] skipped: missedCount <= 0');
        return {};
      }
      const updated = Math.min(s.penaltyGauge + missedCount, PENALTY_MAX);
      const punishmentTriggered = updated >= PENALTY_MAX;
      console.log('[PENALTY] APPLYING:', s.penaltyGauge, '+', missedCount, '=', updated, '| punishmentTriggered:', punishmentTriggered);

      if (s.id) {
        supabaseWrite(
          supabase
            .from('players')
            .update({
              penalty_gauge: updated,
              last_penalty_date: date,
              punishment_triggered: punishmentTriggered,
            })
            .eq('id', s.id) as any,
          'Penalty save error'
        );
      }

      return {
        penaltyGauge: updated,
        lastPenaltyDate: date,
        punishmentTriggered,
      };
    });
    console.log('[PENALTY] applyEndOfDayPenalty set() dispatched');
  },

  setTodayUnchecked(n) {
    const value = Math.max(0, n);
    set({ todayUncheckedCount: value });
  },

  resetStats() {
    const state = get();
    const newLevel = Math.max(1, state.level - 5);
    const baseStats: PlayerStats = {
      str: 10,
      agi: 10,
      int: 10,
      vit: 10,
      endurance: 10,
    };
    const newAp = getTotalAP(newLevel) - getSpentAP(baseStats);
    const combatStats = calculateCombatStats(baseStats, 'unclassed');
    const accentColor = CLASS_CONFIG.unclassed.color;

    set({
      level: newLevel,
      xp: 0,
      stats: baseStats,
      ap: newAp,
      playerClass: 'unclassed',
      accentColor,
      combatStats,
      currentHP: combatStats.hp,
      currentMP: combatStats.mp,
      currentStamina: combatStats.sta,
    });

    const next = get();
    if (next.id) {
      supabaseWrite(
        supabase
          .from('players')
          .update({
            level: next.level,
            xp: 0,
            rank_xp: next.rankXp,
            str: baseStats.str,
            agi: baseStats.agi,
            int: baseStats.int,
            vit: baseStats.vit,
            endurance: baseStats.endurance,
            ap: newAp,
            player_class: 'unclassed',
            combat_hp: combatStats.hp,
            combat_atk: combatStats.atk,
            combat_mp: combatStats.mp,
            combat_sta: combatStats.sta,
            combat_def: combatStats.def,
            combat_spd: combatStats.spd,
            combat_dodge: combatStats.dodge,
            combat_crit_chance: combatStats.crit_chance,
            combat_crit_dmg: combatStats.crit_dmg,
          })
          .eq('id', next.id) as any,
        'Player reset save error'
      );
    }
    set({ resetBannerVisible: true });
    setTimeout(() => usePlayerStore.setState({ resetBannerVisible: false }), 3000);
    console.log(
      '[RESET STATS] Stats reset, level reduced by 5',
      '| previousLevel =',
      state.level,
      '| newLevel =',
      newLevel
    );
  },
}));
