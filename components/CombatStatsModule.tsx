import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { CombatStats } from '../lib/classEngine';

interface CombatStatsModuleProps {
  combatStats: CombatStats;
  accentColor?: string;
}

const STAT_ROWS: { key: keyof CombatStats; label: string }[][] = [
  [
    { key: 'hp', label: 'HP' },
    { key: 'atk', label: 'ATK' },
    { key: 'mp', label: 'MP' },
  ],
  [
    { key: 'sta', label: 'STA' },
    { key: 'def', label: 'DEF' },
    { key: 'spd', label: 'SPD' },
  ],
  [
    { key: 'dodge', label: 'Dodge%' },
    { key: 'crit_chance', label: 'Crit%' },
    { key: 'crit_dmg', label: 'CritDmg%' },
  ],
];

export function CombatStatsModule({ combatStats, accentColor = '#8B5CF6' }: CombatStatsModuleProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: accentColor }]}>COMBAT STATS</Text>
      <View style={styles.statsGrid}>
        {STAT_ROWS.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.statRow}>
            {row.map(({ key, label }) => (
              <View key={key} style={[styles.statCard, { borderColor: accentColor }]}>
                <Text style={styles.statLabel}>{label}</Text>
                <Text style={styles.statValue}>
                  {typeof combatStats[key] === 'number'
                    ? Math.floor(combatStats[key] as number)
                    : combatStats[key]}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: 1,
  },
  statsGrid: {
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#737373',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
