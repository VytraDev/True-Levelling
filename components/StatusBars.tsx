import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusBarsProps {
  maxHP: number;
  maxMP: number;
  maxSTA: number;
  currentHP: number;
  currentMP: number;
  currentStamina: number;
  accentColor?: string;
}

export function StatusBars({
  maxHP,
  maxMP,
  maxSTA,
  currentHP,
  currentMP,
  currentStamina,
  accentColor = '#8B5CF6',
}: StatusBarsProps) {
  const hpPercent = maxHP > 0 ? Math.max(0, (currentHP / maxHP) * 100) : 0;
  const mpPercent = maxMP > 0 ? Math.max(0, (currentMP / maxMP) * 100) : 0;
  const staPercent = maxSTA > 0 ? Math.max(0, (currentStamina / maxSTA) * 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <Text style={[styles.statusLabel, { color: accentColor }]}>HP</Text>
        <View style={[styles.barBackground, { borderColor: accentColor }]}>
          <View style={[styles.barFill, { width: `${hpPercent}%`, backgroundColor: '#10B981' }]} />
        </View>
        <Text style={styles.statusValue}>
          {currentHP}/{maxHP}
        </Text>
      </View>
      <View style={styles.statusRow}>
        <Text style={[styles.statusLabel, { color: accentColor }]}>MP</Text>
        <View style={[styles.barBackground, { borderColor: accentColor }]}>
          <View style={[styles.barFill, { width: `${mpPercent}%`, backgroundColor: '#3B82F6' }]} />
        </View>
        <Text style={styles.statusValue}>
          {currentMP}/{maxMP}
        </Text>
      </View>
      <View style={styles.statusRow}>
        <Text style={[styles.statusLabel, { color: accentColor }]}>STA</Text>
        <View style={[styles.barBackground, { borderColor: accentColor }]}>
          <View style={[styles.barFill, { width: `${staPercent}%`, backgroundColor: '#E5E5E5' }]} />
        </View>
        <Text style={styles.statusValue}>
          {currentStamina}/{maxSTA}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 24,
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusLabel: {
    width: 36,
    fontSize: 12,
    fontWeight: '600',
  },
  barBackground: {
    flex: 1,
    height: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 4,
    borderWidth: 1,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  statusValue: {
    fontSize: 12,
    color: '#A3A3A3',
    minWidth: 50,
    textAlign: 'right',
  },
});
