import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  StyleSheet,
} from 'react-native';
import { CLASS_DESCRIPTIONS } from '../lib/classDescriptions';

interface ClassesModalProps {
  visible: boolean;
  onClose: () => void;
}

const CLASS_ORDER = [
  'assassin',
  'fighter_speed',
  'fighter_brute',
  'tank',
  'caster',
  'mage',
  'unclassed',
];

export function ClassesInformationModal({ visible, onClose }: ClassesModalProps) {
  const [expandedClass, setExpandedClass] = useState<string | null>(null);

  const classes = CLASS_ORDER.map((id) => CLASS_DESCRIPTIONS[id]).filter(Boolean);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>CLASSES INFORMATION</Text>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.classList} showsVerticalScrollIndicator={false}>
            {classes.map((classInfo) => (
              <View key={classInfo.id} style={styles.classItem}>
                <Pressable
                  onPress={() =>
                    setExpandedClass(expandedClass === classInfo.id ? null : classInfo.id)
                  }
                  style={styles.classHeader}
                >
                  <Text style={styles.className}>{classInfo.name}</Text>
                  <Text style={styles.expandIcon}>
                    {expandedClass === classInfo.id ? '▼' : '▶'}
                  </Text>
                </Pressable>

                {expandedClass === classInfo.id && (
                  <View style={styles.classDetails}>
                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.descriptionText}>{classInfo.description}</Text>

                    <Text style={styles.sectionTitle}>How to Become</Text>
                    <Text style={styles.descriptionText}>{classInfo.howToBecome}</Text>

                    <Text style={styles.sectionTitle}>Characteristics</Text>

                    {classInfo.characteristics.positive.length > 0 && (
                      <View style={styles.charList}>
                        {classInfo.characteristics.positive.map((char, idx) => (
                          <Text key={`pos-${idx}`} style={styles.positiveChar}>
                            {char.icon} {char.text}
                          </Text>
                        ))}
                      </View>
                    )}

                    {classInfo.characteristics.negative.length > 0 && (
                      <View style={styles.charList}>
                        {classInfo.characteristics.negative.map((char, idx) => (
                          <Text key={`neg-${idx}`} style={styles.negativeChar}>
                            {char.icon} {char.text}
                          </Text>
                        ))}
                      </View>
                    )}

                    <View style={styles.divider} />
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
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
  container: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    fontSize: 22,
    color: '#737373',
  },
  classList: {
    maxHeight: 500,
    padding: 16,
  },
  classItem: {
    marginBottom: 8,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#252525',
    borderRadius: 10,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  expandIcon: {
    fontSize: 14,
    color: '#A3A3A3',
  },
  classDetails: {
    padding: 16,
    paddingTop: 12,
    backgroundColor: '#1F1F1F',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    marginTop: -4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#737373',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
  },
  charList: {
    marginTop: 4,
  },
  positiveChar: {
    fontSize: 13,
    color: '#34D399',
    marginBottom: 2,
  },
  negativeChar: {
    fontSize: 13,
    color: '#F87171',
    marginBottom: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2A2A',
    marginTop: 16,
  },
});
