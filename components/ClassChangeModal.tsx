import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { CLASS_CONFIG } from '../lib/classEngine';
import { CLASS_DESCRIPTIONS } from '../lib/classDescriptions';
import type { PlayerClass } from '../lib/classEngine';

interface ClassChangeModalProps {
  visible: boolean;
  previousClass: PlayerClass;
  newClass: PlayerClass;
  onAccept: () => void;
}

export function ClassChangeModal({
  visible,
  previousClass,
  newClass,
  onAccept,
}: ClassChangeModalProps) {
  const prevLabel = CLASS_CONFIG[previousClass]?.label ?? previousClass;
  const newLabel = CLASS_CONFIG[newClass]?.label ?? newClass;
  const newColor = CLASS_CONFIG[newClass]?.color ?? '#8B5CF6';
  const classInfo = CLASS_DESCRIPTIONS[newClass];
  const description = classInfo?.description ?? '';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.container, { borderColor: newColor }]}>
          <Text style={styles.systemLabel}>SYSTEM NOTIFICATION</Text>
          <Text style={styles.title}>YOU HAVE AWAKENED A NEW CLASS</Text>
          <View style={styles.classTransition}>
            <Text style={styles.prevClass}>{prevLabel}</Text>
            <Text style={styles.arrow}>──→</Text>
            <Text style={[styles.newClass, { color: newColor }]}>{newLabel}</Text>
          </View>
          {description ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}
          <Pressable
            style={[styles.acceptBtn, { backgroundColor: newColor }]}
            onPress={onAccept}
          >
            <Text style={styles.acceptBtnText}>ACCEPT</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0F0F0F',
    borderRadius: 16,
    borderWidth: 3,
    padding: 24,
    alignItems: 'center',
  },
  systemLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0891B2',
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  classTransition: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  prevClass: {
    fontSize: 16,
    color: '#737373',
    fontWeight: '600',
  },
  arrow: {
    fontSize: 14,
    color: '#525252',
  },
  newClass: {
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    color: '#A3A3A3',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  acceptBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  acceptBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
