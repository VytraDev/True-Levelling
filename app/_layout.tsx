import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Stack, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { resolvePostAuthRoute } from '../lib/authRouter';
import { CURRENT_APP_VERSION } from '../lib/patchNotes';
import { PatchNotesModal } from '../components/PatchNotesModal';

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [showPatchNotesModal, setShowPatchNotesModal] = useState(false);

  useEffect(() => {
    let resolved = false;

    const doResolve = async (session: Parameters<typeof resolvePostAuthRoute>[0]) => {
      console.log('[AUTH] doResolve called, resolved already =', resolved);
      if (resolved) {
        console.log('[AUTH] doResolve: already resolved, bailing out');
        return;
      }
      resolved = true;
      console.log('[AUTH] doResolve: resolved=true set, calling resolvePostAuthRoute...');
      try {
        const route = await resolvePostAuthRoute(session);
        console.log('[AUTH] doResolve: route =', route);
        setInitialRoute(route);
        setAppReady(true);
        console.log('[AUTH] doResolve: setAppReady(true) called');
      } catch (err) {
        console.log('[AUTH] doResolve: resolvePostAuthRoute THREW:', err);
        setInitialRoute('/login');
        setAppReady(true);
        console.log('[AUTH] doResolve: fallback — setAppReady(true) called with /login');
      }
    };

    const checkSession = async () => {
      console.log('=== SESSION CHECK ON APP LAUNCH ===');
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        console.log(
          '[AUTH] getSession() result:',
          session ? `User: ${session.user.email}, Expires: ${session.expires_at}` : 'NULL'
        );
        if (sessionError) console.log('[AUTH] getSession error:', sessionError);

        // getUser() validates the token with the server — it can hang indefinitely on a
        // slow or offline network, blocking the spinner forever. Race it against a 5 s
        // timeout so doResolve() always runs. session is the source of truth for routing.
        console.log('[AUTH] getUser() starting (5 s timeout)...');
        const getUserResult = await Promise.race([
          supabase.auth.getUser(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
        ]);

        if (getUserResult && 'data' in getUserResult) {
          const { data: { user }, error: userError } = getUserResult;
          console.log('[AUTH] getUser() result:', user ? user.email : 'NULL');
          if (userError) console.log('[AUTH] getUser error:', userError);
        } else {
          console.log('[AUTH] getUser() timed out after 5 s — proceeding with session fallback');
        }

        console.log('[AUTH] checkSession: calling doResolve, resolved =', resolved);
        await doResolve(session);
      } catch (err) {
        console.log('[AUTH] checkSession THREW (unhandled):', err);
        console.log('[AUTH] checkSession: forcing doResolve(null) to unblock app');
        await doResolve(null);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        '[AUTH] onAuthStateChange event:', event,
        '| session:', session ? session.user.email : 'NULL',
        '| resolved:', resolved
      );
      if (event === 'INITIAL_SESSION' && !resolved) {
        console.log('[AUTH] INITIAL_SESSION: calling doResolve');
        await doResolve(session);
      } else if (event === 'INITIAL_SESSION' && resolved) {
        console.log('[AUTH] INITIAL_SESSION: resolved already true — skipping');
      } else if (event === 'SIGNED_OUT') {
        router.replace('/login');
      } else if (event === 'SIGNED_IN') {
        console.log('[AUTH] SIGNED_IN: resolving route...');
        const route = await resolvePostAuthRoute(session);
        console.log('[AUTH] SIGNED_IN: navigating to', route);
        router.replace(route);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    console.log('[AUTH] appReady+initialRoute effect: appReady =', appReady, '| initialRoute =', initialRoute);
    if (appReady && initialRoute) {
      console.log('[AUTH] Navigating to:', initialRoute);
      router.replace(initialRoute);
    }
  }, [appReady, initialRoute]);

  useEffect(() => {
    const checkPatchNotes = async () => {
      try {
        const lastSeenVersion = await AsyncStorage.getItem('lastSeenPatchVersion');
        if (lastSeenVersion !== CURRENT_APP_VERSION) {
          console.log('[PATCH NOTES] New version detected:', CURRENT_APP_VERSION);
          setShowPatchNotesModal(true);
          await AsyncStorage.setItem('lastSeenPatchVersion', CURRENT_APP_VERSION);
        }
      } catch (e) {
        console.log('[PATCH NOTES] checkPatchNotes error:', e);
      }
    };
    if (appReady) {
      checkPatchNotes();
    }
  }, [appReady]);

  if (!appReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F0F0F', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 48, color: '#8B5CF6' }}>⚔️</Text>
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="verify-email" />
        <Stack.Screen name="character-creation" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <PatchNotesModal
        visible={showPatchNotesModal}
        onClose={() => setShowPatchNotesModal(false)}
      />
    </>
  );
}
