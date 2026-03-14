import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

export async function resolvePostAuthRoute(
  session: Session | null
): Promise<string> {
  if (!session) {
    return '/login';
  }

  const user = session.user;

  if (!user?.email_confirmed_at) {
    return '/verify-email';
  }

  try {
    const { data: row } = await supabase
      .from('players')
      .select('character_created')
      .eq('user_id', user.id)
      .maybeSingle();

    const characterCreated =
      (row as { character_created?: boolean } | null)?.character_created === true;

    return characterCreated ? '/(tabs)' : '/character-creation';
  } catch {
    // On error, fall back to tabs – user is verified, but we couldn't read player row.
    return '/(tabs)';
  }
}

export async function resolvePostAuthRouteFromCurrentSession(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const session = data.session ?? null;
  return resolvePostAuthRoute(session);
}

