import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { submitFeedback } from '../lib/feedbackAPI';
import { useToastStore } from '../store/toastStore';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
}

type FeedbackType = 'bug' | 'suggestion' | 'other';

export function FeedbackModal({ visible, onClose }: FeedbackModalProps) {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      useToastStore.getState().addToast('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitFeedback({
        feedbackType,
        title: title.trim(),
        description: description.trim(),
      });
      useToastStore.getState().addToast('✓ Thank you for the feedback!');
      handleClose();
    } catch (err) {
      console.error('Feedback error:', err);
      useToastStore.getState().addToast('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setFeedbackType('bug');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>SEND FEEDBACK</Text>
            <Pressable onPress={handleClose} hitSlop={8} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Feedback Type</Text>
            <View style={styles.typeContainer}>
              {(['bug', 'suggestion', 'other'] as FeedbackType[]).map((type) => (
                <Pressable
                  key={type}
                  style={[
                    styles.typeButton,
                    feedbackType === type && styles.typeButtonActive,
                  ]}
                  onPress={() => setFeedbackType(type)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      feedbackType === type && styles.typeButtonTextActive,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Brief title of your feedback"
              placeholderTextColor="#737373"
              value={title}
              onChangeText={setTitle}
              editable={!isSubmitting}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.descriptionInput]}
              placeholder="Detailed description (steps to reproduce for bugs, etc.)"
              placeholderTextColor="#737373"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              editable={!isSubmitting}
            />

            <Text style={styles.helpText}>
              For bugs: describe what happened and how to reproduce it.{'\n'}
              For suggestions: describe what you'd like to see improved.
            </Text>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[
                styles.button,
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Submitting…' : 'Submit'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeBtn: {
    padding: 8,
  },
  closeText: {
    fontSize: 22,
    color: '#737373',
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A3A3A3',
    marginTop: 16,
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#404040',
    backgroundColor: '#252525',
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: '#16A34A',
    backgroundColor: '#1A2E1A',
  },
  typeButtonText: {
    fontSize: 13,
    color: '#A3A3A3',
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#34D399',
  },
  input: {
    backgroundColor: '#0F0F0F',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 12,
  },
  descriptionInput: {
    minHeight: 120,
    paddingTop: 10,
  },
  helpText: {
    fontSize: 12,
    color: '#737373',
    fontStyle: 'italic',
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#404040',
    backgroundColor: '#252525',
  },
  cancelButtonText: {
    color: '#A3A3A3',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#16A34A',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
