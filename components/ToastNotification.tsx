import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Animated, Pressable } from 'react-native';
import { useToastStore, TOAST_UNDO_WINDOW_MS } from '../store/toastStore';

export function ToastNotification() {
  const current = useToastStore((s) => s.current);
  const dismiss = useToastStore((s) => s.dismiss);
  const opacity = React.useRef(new Animated.Value(0)).current;
  const isUndoToast = typeof current === 'object' && current !== null && 'onUndo' in current;

  useEffect(() => {
    if (!current) {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      return;
    }
    const duration = isUndoToast ? TOAST_UNDO_WINDOW_MS : 2000;
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(duration),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => dismiss());
  }, [current, opacity, isUndoToast, dismiss]);

  if (!current) return null;

  const message = typeof current === 'string' ? current : current.message;

  const handleUndo = () => {
    if (typeof current === 'object' && current !== null && 'onUndo' in current) {
      current.onUndo();
    }
    dismiss();
  };

  return (
    <Animated.View
      style={[styles.container, { opacity, pointerEvents: isUndoToast ? 'auto' : 'none' }]}
    >
      <View style={styles.contentRow}>
        <Text style={styles.text}>{message}</Text>
        {isUndoToast && (
          <Pressable onPress={handleUndo} style={styles.undoBtn} hitSlop={8}>
            <Text style={styles.undoBtnText}>UNDO</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignSelf: 'center',
    maxWidth: 360,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  undoBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  undoBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
