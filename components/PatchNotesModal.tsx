import React from 'react';
import {
  Modal,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { getLatestPatchNotes } from '../lib/patchNotes';

interface PatchNotesModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PatchNotesModal({ visible, onClose }: PatchNotesModalProps) {
  const notes = getLatestPatchNotes();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>📋 PATCH NOTES</Text>
            <Text style={styles.version}>v{notes.version}</Text>
            <Text style={styles.date}>{notes.date}</Text>
          </View>

          <ScrollView style={styles.scrollView}>
            <Text style={styles.noteTitle}>{notes.title}</Text>

            {notes.sections.map((section, idx) => (
              <View key={idx} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.category}</Text>
                {section.items.map((item, itemIdx) => (
                  <Text key={itemIdx} style={styles.bulletItem}>
                    • {item}
                  </Text>
                ))}
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              console.log('[PATCH NOTES] Closed modal');
              onClose();
            }}
          >
            <Text style={styles.closeButtonText}>DISMISS</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    maxHeight: '80%',
    width: '100%',
    maxWidth: 400,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B5CF6',
    letterSpacing: 1,
  },
  version: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  date: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  scrollView: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxHeight: 400,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B5CF6',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  bulletItem: {
    fontSize: 12,
    color: '#A3A3A3',
    marginBottom: 4,
    lineHeight: 18,
  },
  closeButton: {
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
