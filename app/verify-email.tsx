import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { resolvePostAuthRouteFromCurrentSession } from '../lib/authRouter';

const CHECK_INTERVAL_MS = 5000;
const RESEND_CONFIRM_MS = 3000;

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [displayEmail, setDisplayEmail] = useState(params.email ?? '');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (displayEmail) return;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const e = data?.session?.user?.email ?? '';
      setDisplayEmail(e);
    })();
  }, [displayEmail]);

  const checkVerified = async () => {
    const { data } = await supabase.auth.getSession();
    const user = data?.session?.user;
    if (user?.email_confirmed_at) {
      setEmailConfirmed(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      const route = await resolvePostAuthRouteFromCurrentSession();
      router.replace(route);
    }
  };

  useEffect(() => {
    checkVerified();
    intervalRef.current = setInterval(checkVerified, CHECK_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleResend = async () => {
    const toSend = displayEmail.trim();
    if (!toSend) return;
    setResendLoading(true);
    setResendSent(false);
    setResendError(null);
    try {
      await supabase.auth.resend({ type: 'signup', email: toSend });
      setResendSent(true);
      setTimeout(() => setResendSent(false), RESEND_CONFIRM_MS);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to resend verification email. Please try again.';
      setResendError(message);
    } finally {
      setResendLoading(false);
    }
  };

  if (emailConfirmed) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.box}>
          <Text style={styles.confirmTitle}>✓ Email Verified!</Text>
          <Text style={styles.confirmSubtitle}>Redirecting...</Text>
          <Pressable
            style={styles.confirmTapBtn}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.confirmTapText}>Or tap here to continue</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.box}>
        <Text style={styles.title}>CHECK YOUR EMAIL</Text>
        <Text style={styles.emoji}>📧</Text>
        <Text style={styles.message}>
          We sent a verification link to {displayEmail || 'your email'}.
        </Text>
        <Text style={styles.hint}>
          Click the link in your email to activate your account.
        </Text>

        <Pressable
          style={[styles.resendBtn, resendLoading && styles.resendBtnDisabled]}
          onPress={handleResend}
          disabled={resendLoading}
        >
          {resendLoading ? (
            <ActivityIndicator color="#8B5CF6" size="small" />
          ) : (
            <Text style={styles.resendBtnText}>
              {resendSent ? 'Email sent!' : 'Resend Email'}
            </Text>
          )}
        </Pressable>

        {resendError ? <Text style={styles.error}>{resendError}</Text> : null}

        <View style={styles.footer}>
          <Link href="/login" asChild>
            <Pressable>
              <Text style={styles.backLink}>Back to Login</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  box: {
    width: '100%',
    maxWidth: 390,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F59E0B',
    marginBottom: 24,
    letterSpacing: 1,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: '#A3A3A3',
    textAlign: 'center',
    marginBottom: 32,
  },
  resendBtn: {
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 160,
    alignItems: 'center',
  },
  resendBtnDisabled: {
    opacity: 0.7,
  },
  resendBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  footer: {
    marginTop: 32,
  },
  backLink: {
    fontSize: 14,
    color: '#A855F7',
    fontWeight: '600',
  },
  error: {
    marginTop: 16,
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#16A34A',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmSubtitle: {
    fontSize: 16,
    color: '#A3A3A3',
    marginBottom: 24,
    textAlign: 'center',
  },
  confirmTapBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  confirmTapText: {
    fontSize: 14,
    color: '#A855F7',
    fontWeight: '600',
  },
});
