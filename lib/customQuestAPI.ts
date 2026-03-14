import { supabase } from './supabase';

export interface EvaluationResult {
  approved: boolean;
  difficulty?: 'easy' | 'medium' | 'hard';
  xp_reward?: number;
  gold_reward?: number;
  reasoning: string;
}

const EDGE_FUNCTION_URL = 'https://znhdwoyduergrzyswdhl.supabase.co/functions/v1/custom-quest-evaluator';
const FETCH_TIMEOUT_MS = 60_000;

export async function evaluateCustomQuestWithClaude(
  name: string,
  description: string,
  playerLevel: number
): Promise<EvaluationResult> {
  const body = { name, description, playerLevel };
  console.log('Calling evaluator...', { name, description, playerLevel });

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  if (!token) {
    throw new Error('Not authenticated');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        console.warn('Evaluator request timed out');
        throw new Error('Evaluation timed out. Please try again.');
      }
      console.error('Evaluator fetch error:', err.message);
      throw new Error(err.message || 'Network error');
    }
    throw err;
  }
  clearTimeout(timeoutId);

  const contentType = response.headers.get('content-type');
  console.log('Evaluator response status:', response.status, response.statusText, 'Content-Type:', contentType ?? '(none)');

  const rawText = await response.text();

  if (response.ok) {
    console.log('Evaluator returned 200, response text:', rawText);
  }

  let data: EvaluationResult;
  try {
    const parsed: unknown = JSON.parse(rawText);
    // If the Edge Function double-stringified, unwrap once
    if (typeof parsed === 'string') {
      try {
        data = JSON.parse(parsed) as EvaluationResult;
      } catch {
        console.error('Double-stringified parse failed. Inner value:', parsed?.slice(0, 200));
        throw new Error('Failed to parse evaluator response');
      }
    } else {
      data = parsed as EvaluationResult;
    }
    console.log('Parsed response:', data);
  } catch (e) {
    console.error('JSON parse error:', e, 'Raw response (first 500 chars):', rawText?.slice(0, 500));
    throw new Error('Failed to parse evaluator response');
  }

  if (!response.ok) {
    const msg = (data as unknown as { details?: string; error?: string; message?: string })?.details
      ?? (data as unknown as { details?: string; error?: string; message?: string })?.error
      ?? (data as unknown as { details?: string; error?: string; message?: string })?.message
      ?? `Evaluation failed (${response.status})`;
    console.error('Evaluator error response:', data);
    throw new Error(msg);
  }

  console.log('Evaluator returning:', data);
  return data;
}
