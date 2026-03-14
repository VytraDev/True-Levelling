import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

interface SystemAwakeningProps {
  visible: boolean;
  onFinished: () => void;
  /** When provided, REFUSE shows the "No U" flow instead of the default animation. */
  onRefuse?: () => void;
}

export function SystemAwakening({ visible, onFinished, onRefuse }: SystemAwakeningProps) {
  const [locked, setLocked] = useState(false);

  const step1Opacity = useRef(new Animated.Value(0)).current;
  const step2Opacity = useRef(new Animated.Value(0)).current;
  const step3Opacity = useRef(new Animated.Value(0)).current;
  const cardsOpacity = useRef(new Animated.Value(0)).current;
  const cardsTranslateY = useRef(new Animated.Value(40)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    step1Opacity.setValue(0);
    step2Opacity.setValue(0);
    step3Opacity.setValue(0);
    cardsOpacity.setValue(0);
    cardsTranslateY.setValue(40);
    flashOpacity.setValue(0);
    setLocked(false);

    Animated.sequence([
      Animated.timing(step1Opacity, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.delay(300),
      Animated.timing(step2Opacity, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.delay(700),
      Animated.timing(step3Opacity, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(cardsOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(cardsTranslateY, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [visible, step1Opacity, step2Opacity, step3Opacity, cardsOpacity, cardsTranslateY, flashOpacity]);

  const handleRefuse = () => {
    if (locked) return;
    setLocked(true);
    if (onRefuse) {
      onRefuse();
      return;
    }
    step1Opacity.setValue(0);
    step2Opacity.setValue(0);
    step3Opacity.setValue(0);
    cardsOpacity.setValue(0);

    Animated.timing(step2Opacity, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    Animated.timing(step3Opacity, {
      toValue: 1,
      delay: 400,
      duration: 800,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      onFinished();
    }, 2000);
  };

  const handleAccept = () => {
    if (locked) return;
    setLocked(true);
    Animated.sequence([
      Animated.timing(flashOpacity, {
        toValue: 0.8,
        duration: 150,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(flashOpacity, {
        toValue: 0,
        duration: 250,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinished();
    });
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <Animated.View style={[styles.container, { opacity: step1Opacity }]}>
        <Text style={styles.systemLabel}>SYSTEM NOTIFICATION</Text>
      </Animated.View>

      <Animated.View style={[styles.block, { opacity: step2Opacity }]}>
        <Text style={styles.line}>You have acquired the qualifications</Text>
        <Text style={styles.line}>to be a</Text>
      </Animated.View>

      <Animated.View style={[styles.playerBlock, { opacity: step3Opacity }]}>
        <Text style={styles.playerText}>P L A Y E R</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.cardsRow,
          {
            opacity: cardsOpacity,
            transform: [{ translateY: cardsTranslateY }],
          },
        ]}
      >
        <Pressable style={styles.card} onPress={handleRefuse}>
          <Text style={styles.cardTitle}>✗ REFUSE</Text>
          <Text style={styles.cardSubtitle}>Return to your ordinary life.</Text>
        </Pressable>
        <Pressable style={[styles.card, styles.cardAccept]} onPress={handleAccept}>
          <Text style={styles.cardTitleAccept}>✓ ACCEPT</Text>
          <Text style={styles.cardSubtitleAccept}>Your fate has been decided.</Text>
        </Pressable>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[styles.flash, { opacity: flashOpacity }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  container: {
    position: 'absolute',
    top: '18%',
  },
  systemLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    letterSpacing: 6,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  block: {
    position: 'absolute',
    top: '35%',
    alignItems: 'center',
  },
  line: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 4,
  },
  playerBlock: {
    position: 'absolute',
    top: '48%',
  },
  playerText: {
    color: '#8B5CF6',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(139, 92, 246, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  cardsRow: {
    position: 'absolute',
    bottom: '14%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 380,
  },
  card: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4B5563',
    backgroundColor: '#111827',
  },
  cardAccept: {
    backgroundColor: '#8B5CF6',
    borderColor: '#A855F7',
  },
  cardTitle: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardTitleAccept: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  cardSubtitleAccept: {
    color: '#EDE9FE',
    fontSize: 12,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
});

