import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

interface MissedQuestNotificationProps {
  visible: boolean;
  questNames: string[];
  onDismiss: () => void;
}

export function MissedQuestNotification({
  visible,
  questNames,
  onDismiss,
}: MissedQuestNotificationProps) {
  if (!visible || questNames.length === 0) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>Notice</Text>
          <Text style={styles.message}>You have failed to complete your quests:</Text>
          <View style={styles.list}>
            {questNames.map((name) => (
              <Text key={name} style={styles.bullet}>• {name}</Text>
            ))}
          </View>
          <Text style={styles.footer}>Penalties have been applied appropriately.</Text>
          <Pressable style={styles.okButton} onPress={onDismiss}>
            <Text style={styles.okButtonText}>OK</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  box: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#D1D5DB',
    marginBottom: 12,
  },
  list: { marginBottom: 16, paddingLeft: 8 },
  bullet: {
    fontSize: 14,
    color: '#E5E5E5',
    marginBottom: 4,
  },
  footer: {
    fontSize: 13,
    color: '#737373',
    marginBottom: 20,
  },
  okButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  okButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
