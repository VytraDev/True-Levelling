// Stat shape used for class detection and combat calc (matches PlayerStats)
export interface ClassStats {
  str: number;
  agi: number;
  int: number;
  vit: number;
  endurance: number;
}

export type PlayerClass =
  | 'unclassed'
  | 'assassin'
  | 'fighter_speed'
  | 'fighter_brute'
  | 'tank'
  | 'caster'
  | 'mage';

export interface CombatStats {
  hp: number;
  atk: number;
  mp: number;
  sta: number;
  def: number;
  spd: number;
  dodge: number;
  crit_chance: number;
  crit_dmg: number;
}

// PART 1 — COEFFICIENT CONFIG
export const COMBAT_COEFFICIENTS = {
  unclassed: {
    hp: 1.0,
    atk: 1.0,
    mp: 1.0,
    sta: 1.0,
    def: 1.0,
    spd: 1.0,
    dodge: 0.5,
    crit_chance: 0.5,
    crit_dmg: 5.0,
  },
  assassin: {
    hp: 0.7,
    atk: 1.5,
    mp: 0.8,
    sta: 1.3,
    def: 0.6,
    spd: 2.5,
    dodge: 1.5,
    crit_chance: 2.5,
    crit_dmg: 15.0,
  },
  fighter_speed: {
    hp: 1.0,
    atk: 1.5,
    mp: 0.9,
    sta: 1.2,
    def: 0.8,
    spd: 2.0,
    dodge: 0.8,
    crit_chance: 1.2,
    crit_dmg: 8.0,
  },
  fighter_brute: {
    hp: 1.5,
    atk: 2.0,
    mp: 0.5,
    sta: 1.5,
    def: 1.2,
    spd: 0.6,
    dodge: 0.3,
    crit_chance: 0.5,
    crit_dmg: 12.0,
  },
  tank: {
    hp: 2.5,
    atk: 0.7,
    mp: 1.0,
    sta: 2.0,
    def: 2.5,
    spd: 0.5,
    dodge: 0.2,
    crit_chance: 0.3,
    crit_dmg: 4.0,
    thorns: 0.3,
  },
  caster: {
    hp: 0.8,
    atk: 0.7,
    mp: 2.5,
    sta: 0.9,
    def: 0.5,
    spd: 2.0,
    dodge: 1.0,
    crit_chance: 0.8,
    crit_dmg: 6.0,
    solo_buff_multiplier: 1.5,
  },
  mage: {
    hp: 0.9,
    atk: 2.0,
    mp: 3.0,
    sta: 0.8,
    def: 0.6,
    spd: 0.5,
    dodge: 0.4,
    crit_chance: 0.6,
    crit_dmg: 10.0,
  },
  base: {
    hp: 100,
    atk: 10,
    mp: 10,
    sta: 10,
    def: 5,
    spd: 10,
  },
  damage: {
    crit_multiplier: 1.5,
  },
} as const;

// PART 2 — CLASS PROMOTION REQUIREMENTS & CONFIG
export const CLASS_REQUIREMENTS: Record<Exclude<PlayerClass, 'unclassed'>, Partial<ClassStats>> = {
  assassin: { agi: 25, str: 20, endurance: 15 },
  fighter_speed: { str: 20, agi: 20, endurance: 20 },
  fighter_brute: { str: 30, endurance: 15, vit: 15 },
  tank: { vit: 25, endurance: 25 },
  caster: { int: 25, agi: 25 },
  mage: { int: 30, str: 20 },
};

export const CLASS_CONFIG: Record<
  PlayerClass,
  { label: string; color: string; evolution: string | null }
> = {
  unclassed: { label: 'Unclassed', color: '#8B5CF6', evolution: null },
  assassin: { label: 'Assassin', color: '#DC2626', evolution: 'Shadow Monarch' },
  fighter_speed: { label: 'Fighter: Speed', color: '#F97316', evolution: 'Blade Master' },
  fighter_brute: { label: 'Fighter: Brute', color: '#D97706', evolution: 'Berserker' },
  tank: { label: 'Tank', color: '#2563EB', evolution: 'Iron Fortress' },
  caster: { label: 'Caster', color: '#0891B2', evolution: 'Arcane Trickster' },
  mage: { label: 'Mage', color: '#7C3AED', evolution: 'Grand Magus' },
};

// PART 2.5 — AP ECONOMY (total AP = level × 5; base stats sum = 50)
export function getTotalAP(level: number): number {
  return level * 5;
}

export function getSpentAP(stats: ClassStats): number {
  return stats.str + stats.agi + stats.int + stats.vit + stats.endurance - 50;
}

// PART 3 — CLASS DETECTION
export function detectClass(
  stats: ClassStats,
  level: number
): PlayerClass {
  if (level < 6) return 'unclassed';

  const r = CLASS_REQUIREMENTS;
  const s = stats;

  if (s.int >= r.mage.int! && s.str >= r.mage.str!) return 'mage';
  if (s.int >= r.caster.int! && s.agi >= r.caster.agi!) return 'caster';
  if (
    s.str >= r.fighter_brute.str! &&
    s.endurance >= r.fighter_brute.endurance! &&
    s.vit >= r.fighter_brute.vit!
  )
    return 'fighter_brute';
  if (
    s.str >= r.fighter_speed.str! &&
    s.agi >= r.fighter_speed.agi! &&
    s.endurance >= r.fighter_speed.endurance!
  )
    return 'fighter_speed';
  if (
    s.agi >= r.assassin.agi! &&
    s.str >= r.assassin.str! &&
    s.endurance >= r.assassin.endurance!
  )
    return 'assassin';
  if (s.vit >= r.tank.vit! && s.endurance >= r.tank.endurance!) return 'tank';

  return 'unclassed';
}

// PART 4 — COMBAT STAT CALCULATOR
export function calculateCombatStats(
  stats: ClassStats,
  playerClass: PlayerClass
): CombatStats {
  const coeffs = COMBAT_COEFFICIENTS[playerClass] ?? COMBAT_COEFFICIENTS.unclassed;
  const base = COMBAT_COEFFICIENTS.base;

  return {
    hp: Math.floor(base.hp + stats.vit * ((coeffs as Record<string, number>).hp ?? 1.0)),
    atk: Math.floor(base.atk + stats.str * ((coeffs as Record<string, number>).atk ?? 1.0)),
    mp: Math.floor(base.mp + stats.int * ((coeffs as Record<string, number>).mp ?? 1.0)),
    sta: Math.floor(base.sta + stats.endurance * ((coeffs as Record<string, number>).sta ?? 1.0)),
    def: Math.floor(base.def + stats.endurance * ((coeffs as Record<string, number>).def ?? 0.5)),
    spd: Math.floor(base.spd + stats.agi * ((coeffs as Record<string, number>).spd ?? 1.0)),
    dodge: parseFloat(
      (stats.agi * ((coeffs as Record<string, number>).dodge ?? 0.5)).toFixed(1)
    ),
    crit_chance: parseFloat(
      (stats.agi * ((coeffs as Record<string, number>).crit_chance ?? 0.5)).toFixed(1)
    ),
    crit_dmg: parseFloat(
      (stats.str * ((coeffs as Record<string, number>).crit_dmg ?? 5.0)).toFixed(1)
    ),
  };
}
