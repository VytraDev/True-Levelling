import { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
} from 'react-native';

const OVERLAY_OPACITY = 0.85;
const AUTO_DISMISS_MS = 5000;

interface LevelUpModalProps {
  visible: boolean;
  onDismiss: () => void;
  level: number;
  levelJustChanged?: boolean;
  classJustChanged?: boolean;
  className?: string;
  accentColor?: string;
  rankChanged?: boolean;
  newRank?: string;
  apGained?: number;
}

export function LevelUpModal({
  visible,
  onDismiss,
  level,
  levelJustChanged = false,
  classJustChanged = false,
  className = '',
  accentColor = '#8B5CF6',
  rankChanged = false,
  newRank = '',
  apGained = 0,
}: LevelUpModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.7);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [visible, onDismiss]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            }]}
        >
          {levelJustChanged ? (
            <>
              <Text style={styles.emoji}>⚡</Text>
              <Text style={styles.title}>LEVEL UP</Text>
              <Text style={styles.levelText}>You are now Level {level}</Text>
              <Text style={styles.apText}>+{apGained} AP Available</Text>
              {classJustChanged && className ? (
                <Text style={[styles.classText, { color: accentColor }]}>
                  Class Promoted: {className}
                </Text>
              ) : null}
            </>
          ) : null}
          {rankChanged && newRank ? (
            <>
              {!levelJustChanged ? (
                <Text style={styles.emoji}>🏆</Text>
              ) : null}
              <Text style={styles.rankTitle}>RANK UP</Text>
              <Text style={styles.rankText}>
                You are now {newRank}-Rank
              </Text>
            </>
          ) : null}
          <Pressable
            style={styles.continueButton}
            onPress={onDismiss}
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: `rgba(0,0,0,${OVERLAY_OPACITY})`,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: 1,
  },
  levelText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#8B5CF6',
    marginBottom: 8,
  },
  apText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F59E0B',
    marginBottom: 16,
  },
  classText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 24,
  },
  rankTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F59E0B',
    marginTop: 8,
    marginBottom: 6,
    letterSpacing: 1,
  },
  rankText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 24,
  },
  continueButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 160,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
