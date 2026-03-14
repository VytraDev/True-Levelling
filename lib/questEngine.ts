import type { PlayerClass } from './classEngine';
import type { PlayerStats } from '../store/playerStore';
import { DAILY_QUEST_POOL, CLASS_SPECIAL_QUEST_POOL } from './questConfig';

export type QuestCategory = keyof typeof DAILY_QUEST_POOL;

export interface QuestInsert {
  player_id: string;
  player_name?: string;
  date: string;
  name: string;
  category: string;
  xp_reward: number;
  gold_reward: number;
  description?: string | null;
  difficulty?: string | null;
}

type PoolQuest = {
  name: string;
  description: string;
  baseDifficulty: string;
  baseXP: number;
  baseGold: number;
  statReq: Partial<Record<keyof PlayerStats, number>>;
};

const TIER_REQUIREMENTS: Record<string, number> = {
  easy: 10,
  'easy+': 20,
  medium: 35,
  'medium+': 45,
  hard: 60,
  'hard+': 75,
  sjw: 100,
};

function getMaxTierForStat(stat: number): string {
  const tiers = Object.entries(TIER_REQUIREMENTS)
    .filter(([_, req]) => stat >= req)
    .sort((a, b) => b[1] - a[1]);
  return tiers[0]?.[0] || 'easy';
}

const CATEGORY_MAIN_STAT: Record<QuestCategory, keyof PlayerStats> = {
  strength: 'str',
  dexterity: 'agi',
  intelligence: 'int',
  vigour: 'endurance',
  health: 'vit',
};

const ALL_CATEGORIES: QuestCategory[] = ['strength', 'dexterity', 'intelligence', 'vigour', 'health'];

/** Fixed slots per class (guaranteed categories). Remaining slots up to 4 are filled randomly. */
const CLASS_FIXED_SLOTS: Record<PlayerClass, QuestCategory[]> = {
  unclassed: [],
  assassin: ['dexterity', 'dexterity'],
  fighter_speed: ['strength', 'dexterity'],
  fighter_brute: ['strength', 'strength'],
  tank: ['health', 'vigour'],
  caster: ['intelligence', 'dexterity'],
  mage: ['intelligence', 'intelligence'],
};

/** Pick count items from arr at random without replacement (shuffle then slice). */
function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/** Main stat used to scale class special quest rewards (stat or level, whichever is higher). */
const CLASS_MAIN_STAT: Record<PlayerClass, keyof PlayerStats | null> = {
  unclassed: null,
  assassin: 'agi',
  fighter_speed: 'agi',
  fighter_brute: 'str',
  tank: 'endurance',
  caster: 'int',
  mage: 'int',
};

function meetsStatReq(quest: PoolQuest, stats: PlayerStats): boolean {
  for (const [stat, minVal] of Object.entries(quest.statReq)) {
    const key = stat as keyof PlayerStats;
    const playerVal = stats[key] ?? 0;
    if (playerVal < (minVal as number)) return false;
  }
  return true;
}

/** Pick one quest for a slot: hardest qualified not yet used; if none qualify or all used, fall back to easiest in category. */
function pickForSlot(
  pool: PoolQuest[],
  stats: PlayerStats,
  usedNames: Set<string>
): PoolQuest {
  const qualified = pool.filter((q) => meetsStatReq(q, stats));

  // If somehow nothing qualifies in this tier-filtered pool, fall back to the
  // absolute easiest quest in the original pool so we always return something.
  if (qualified.length === 0) {
    return [...pool].sort((a, b) => a.baseXP - b.baseXP)[0] as PoolQuest;
  }

  // Within the tier-filtered pool, we want variety instead of always picking
  // the first entry. Prefer any quest the player hasn't seen yet today, and
  // pick randomly among those.
  const unseen = qualified.filter((q) => !usedNames.has(q.name));
  const candidates = unseen.length > 0 ? unseen : qualified;

  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  return shuffled[0];
}

function pickForCategory(
  category: QuestCategory,
  pool: PoolQuest[],
  stats: PlayerStats,
  usedNames: Set<string>
): PoolQuest {
  const mainStatKey = CATEGORY_MAIN_STAT[category];
  const statValue = stats[mainStatKey] ?? 0;
  const maxTier = getMaxTierForStat(statValue);
  const tierPool = pool.filter((q) => q.baseDifficulty === maxTier);
  const effectivePool = tierPool.length > 0 ? tierPool : pool;
  console.log(
    `Filtering ${category} pool from ${pool.length} to ${tierPool.length} (max tier: ${maxTier})`
  );
  return pickForSlot(effectivePool, stats, usedNames);
}

export function generateDailyQuests(
  playerId: string,
  stats: PlayerStats,
  playerClass: PlayerClass,
  date: string,
  level: number,
  isBreakDay: boolean
): QuestInsert[] {
  console.log('=== GENERATING DAILY QUESTS ===');
  console.log('Player ID:', playerId);
  console.log('Player class:', playerClass);
  console.log('Date for generation:', date);
  console.log('Level:', level);
  console.log('Is break day:', isBreakDay);
  console.log('Player stats snapshot:', stats);

  const usedNames = new Set<string>();
  const daily: QuestInsert[] = [];

  if (isBreakDay) {
    const healthPool = DAILY_QUEST_POOL['health'] as PoolQuest[];
    const vigourPool = DAILY_QUEST_POOL['vigour'] as PoolQuest[];
    console.log('Health pool size:', healthPool.length);
    console.log('Vigour pool size:', vigourPool.length);
    const healthPick = pickForCategory('health', healthPool, stats, usedNames);
    usedNames.add(healthPick.name);
    daily.push({
      player_id: playerId,
      date,
      name: healthPick.name,
      category: 'health',
      xp_reward: healthPick.baseXP,
      gold_reward: healthPick.baseGold,
      description: healthPick.description ?? null,
      difficulty: healthPick.baseDifficulty ?? 'easy',
    });
    const vigourPick = pickForCategory('vigour', vigourPool, stats, usedNames);
    usedNames.add(vigourPick.name);
    daily.push({
      player_id: playerId,
      date,
      name: vigourPick.name,
      category: 'vigour',
      xp_reward: vigourPick.baseXP,
      gold_reward: vigourPick.baseGold,
      description: vigourPick.description ?? null,
      difficulty: vigourPick.baseDifficulty ?? 'easy',
    });
  } else {
    const fixedSlots = CLASS_FIXED_SLOTS[playerClass];
    const randomCount = 4 - fixedSlots.length;

    const usedByFixed: Record<string, number> = {};
    for (const c of fixedSlots) {
      usedByFixed[c] = (usedByFixed[c] ?? 0) + 1;
    }
    const remaining = ALL_CATEGORIES.filter((c) => {
      const n = usedByFixed[c] ?? 0;
      if (n > 0) {
        usedByFixed[c] = n - 1;
        return false;
      }
      return true;
    });
    console.log('Fixed slots for class:', fixedSlots);
    console.log('Remaining categories before random pick:', remaining);
    const randomSlots = pickRandom(remaining, randomCount);
    console.log('Random slots selected:', randomSlots);
    const slots: QuestCategory[] = [...fixedSlots, ...randomSlots];
    console.log('All slots (fixed + random):', slots);

    for (const category of slots) {
      const pool = DAILY_QUEST_POOL[category] as PoolQuest[];
      console.log(
        `Pool for category ${category} (size ${pool.length}):`,
        pool.map((q) => ({ name: q.name, baseXP: q.baseXP }))
      );
      const picked = pickForCategory(category, pool, stats, usedNames);
      usedNames.add(picked.name);
      console.log('Picked quest for slot:', {
        category,
        name: picked.name,
        baseXP: picked.baseXP,
      });
      daily.push({
        player_id: playerId,
        date,
        name: picked.name,
        category,
        xp_reward: picked.baseXP,
        gold_reward: picked.baseGold,
        description: picked.description ?? null,
        difficulty: picked.baseDifficulty ?? 'easy',
      });
    }
  }

  if (playerClass !== 'unclassed') {
    const specialPool = CLASS_SPECIAL_QUEST_POOL[playerClass];
    if (specialPool.length > 0) {
      const special = specialPool[Math.floor(Math.random() * specialPool.length)];
      const mainStat = CLASS_MAIN_STAT[playerClass];
      const statValue = mainStat ? (stats[mainStat] ?? 10) : 10;
      const scalingValue = Math.max(statValue, level);
      const bonus = Math.floor((scalingValue - 10) * 3);
      const specialXP = Math.max(150, 150 + bonus);
      const specialGold = Math.floor(specialXP / 2);
      console.log('Special quest pool size:', specialPool.length);
      console.log('Selected special quest:', {
        name: special.name,
        stat: mainStat,
        statValue,
        scalingValue,
        specialXP,
        specialGold,
      });
      daily.push({
        player_id: playerId,
        date,
        name: special.name,
        category: 'class',
        xp_reward: specialXP,
        gold_reward: specialGold,
        description: special.description ?? null,
        difficulty: 'medium',
      });
    }
  }

  console.log(
    'Final generated daily quests:',
    daily.map((q) => ({ name: q.name, category: q.category, xp: q.xp_reward }))
  );

  return daily;
}
