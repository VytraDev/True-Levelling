import { supabase } from './supabase';
import { getPlayerNameByUserId } from './playerAPI';

export interface FeedbackSubmission {
  feedbackType: 'bug' | 'suggestion' | 'other';
  title: string;
  description: string;
}

export async function submitFeedback(feedback: FeedbackSubmission) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const playerName = await getPlayerNameByUserId(user.id);

  const { error } = await supabase.from('feedback').insert({
    player_id: user.id,
    player_name: playerName,
    feedback_type: feedback.feedbackType,
    title: feedback.title,
    description: feedback.description,
  });

  if (error) throw error;

  return { success: true };
}
