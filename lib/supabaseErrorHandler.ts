import { useToastStore } from '../store/toastStore';

export interface SupabaseWriteResult {
  success: boolean;
  errorMessage?: string;
}

/**
 * Wraps a Supabase write (insert/update/delete) promise-like object, logs failures,
 * and surfaces a generic toast so the user can retry the action.
 *
 * Accepts the value returned by Supabase query builders (which are thenable),
 * or an explicit Promise of `{ data, error }`.
 */
export async function supabaseWrite(
  promiseLike: unknown,
  logPrefix: string = 'Supabase write error'
): Promise<SupabaseWriteResult> {
  try {
    const { error } = (await (promiseLike as any)) as {
      data: unknown;
      error: { message?: string } | null;
    };

    if (error) {
      const message = error.message ?? 'Unknown error';
      // Log with context for debugging
      // eslint-disable-next-line no-console
      console.error(`${logPrefix}:`, message);

      try {
        useToastStore.getState().addToast('Operation failed. Try again.');
      } catch {
        // In case store is not initialised yet, fail silently here.
      }

      return { success: false, errorMessage: message };
    }

    return { success: true };
  } catch (err) {
    // Network or unexpected error
    // eslint-disable-next-line no-console
    console.error(logPrefix, err);
    try {
      useToastStore.getState().addToast('Operation failed. Try again.');
    } catch {
      // ignore
    }
    return {
      success: false,
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }
}

