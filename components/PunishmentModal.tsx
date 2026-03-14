import { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
} from 'react-native';

interface PunishmentModalProps {
  visible: boolean;
  onAccept: () => void;
}

export function PunishmentModal({ visible, onAccept }: PunishmentModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.6);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 550,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onAccept}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Text style={styles.title}>PUNISHMENT QUEST ACTIVATED</Text>
          <Text style={styles.subtitle}>
            You have failed the System&apos;s expectations.
          </Text>
          <Text style={styles.metaText}>Days of failure recorded.</Text>

          <View style={styles.bodyBlock}>
            <Text style={styles.bodyText}>
              A challenger beyond your power has appeared.
            </Text>
            <Text style={styles.bodyText}>Survive if you can, Hunter.</Text>
          </View>

          <View style={styles.bodyBlock}>
            <Text style={styles.comingSoonLabel}>COMBAT SYSTEM COMING SOON</Text>
            <Text style={styles.bodyText}>
              For now, your penalty gauge has been reset.
            </Text>
            <Text style={styles.bodyText}>Do not fail again.</Text>
          </View>

          <Pressable
            style={styles.acceptButton}
            onPress={onAccept}
            android_ripple={{ color: 'rgba(0,0,0,0.3)' }}
          >
            <Text style={styles.acceptText}>Accept Your Fate</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    maxWidth: 340,
    backgroundColor: '#000000',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#7F1D1D',
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F87171',
    textAlign: 'center',
    letterSpacing: 1.5,
    marginBottom: 12,
    textShadowColor: '#991B1B',
    textShadowRadius: 16,
  },
  subtitle: {
    fontSize: 13,
    color: '#E5E5E5',
    textAlign: 'center',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#FCA5A5',
    marginBottom: 16,
  },
  bodyBlock: {
    marginBottom: 16,
  },
  bodyText: {
    fontSize: 13,
    color: '#A3A3A3',
    textAlign: 'center',
    lineHeight: 18,
  },
  comingSoonLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F97316',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 6,
  },
  acceptButton: {
    marginTop: 8,
    backgroundColor: '#7F1D1D',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  acceptText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FECACA',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

