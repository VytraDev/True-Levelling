export const RANK_THRESHOLDS: Record<
  string,
  { min: number; max: number; next: string | null }
> = {
  E: { min: 0, max: 10000, next: 'D' },
  D: { min: 10000, max: 30000, next: 'C' },
  C: { min: 30000, max: 60000, next: 'B' },
  B: { min: 60000, max: 100000, next: 'A' },
  A: { min: 100000, max: 200000, next: 'S' },
  S: { min: 200000, max: 500000, next: 'National' },
  National: { min: 500000, max: 1000000, next: 'Monarch' },
  Monarch: { min: 1000000, max: 1000000, next: null },
};

export function getRankProgress(
  rank: string,
  rankXp: number
): { current: number; max: number; next: string | null; progress: number } {
  const threshold = RANK_THRESHOLDS[rank];
  if (!threshold)
    return { current: 0, max: 10000, next: 'D', progress: 0 };
  const current = rankXp - threshold.min;
  const max = threshold.max - threshold.min;
  const progress = max > 0 ? Math.min(current / max, 1) : 1;
  return { current, max, next: threshold.next, progress };
}
