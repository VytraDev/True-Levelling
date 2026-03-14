import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '../lib/supabase';

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required.';
  if (!EMAIL_REGEX.test(email.trim())) return 'Please enter a valid email address.';
  return null;
}

function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

const MIN_STRENGTH_FOR_SUBMIT = 3;

function passwordStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[!@#$%^&*]/.test(pw)) score++;
  return score;
}

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const runValidation = (): boolean => {
    const e = validateEmail(email);
    const p = validatePassword(password);
    const match = password === confirmPassword ? null : 'Passwords do not match.';
    setEmailError(e);
    setPasswordError(p);
    setConfirmError(match);
    return !e && !p && !match;
  };

  const strength = passwordStrength(password);
  const canSubmitByStrength = strength >= MIN_STRENGTH_FOR_SUBMIT;

  const handleSignUp = async () => {
    setSubmitError(null);
    if (!runValidation()) return;
    if (!canSubmitByStrength) return;

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: undefined },
      });

      if (signUpError) {
        // When email confirmation is disabled, Supabase returns "User already registered"
        const isAlreadyRegistered =
          /already registered|already exists|already in use/i.test(signUpError.message);
        if (isAlreadyRegistered) {
          setSubmitError('This email is already registered. Please log in.');
        } else {
          setSubmitError(signUpError.message);
        }
        return;
      }

      // When email confirmation is enabled, Supabase does not error on duplicate email;
      // response.data.user.identities is empty when the user already existed.
      const identities = data?.user?.identities ?? [];
      if (identities.length === 0) {
        setSubmitError('This email is already registered. Please log in.');
        return;
      }

      router.replace({ pathname: '/verify-email', params: { email: email.trim() } });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Sign up failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      >
        <View style={styles.box}>
          <Text style={styles.title}>⚔️ TRUE LEVELLING</Text>
          <Text style={styles.subtitle}>Join the System, Hunter.</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, emailFocused && styles.inputFocused]}
            value={email}
            onChangeText={(t) => { setEmail(t); setEmailError(null); setSubmitError(null); }}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            placeholder="you@example.com"
            placeholderTextColor="#737373"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {emailError ? <Text style={styles.inlineError}>{emailError}</Text> : null}

          <Text style={styles.label}>Password</Text>
          <View style={[styles.passwordRow, passwordFocused && styles.passwordRowFocused]}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              value={password}
              onChangeText={(t) => { setPassword(t); setPasswordError(null); setConfirmError(null); setSubmitError(null); }}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              placeholder="Min 8 characters"
              placeholderTextColor="#737373"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword((p) => !p)}>
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.strengthBox}>
            <Text style={styles.strengthLabel}>Requirements (need 3+):</Text>
            <Text style={[styles.strengthItem, password.length >= 8 && styles.strengthMet]}>{password.length >= 8 ? '✅' : '☐'} At least 8 characters</Text>
            <Text style={[styles.strengthItem, /[A-Z]/.test(password) && styles.strengthMet]}>{/[A-Z]/.test(password) ? '✅' : '☐'} At least 1 uppercase</Text>
            <Text style={[styles.strengthItem, /[0-9]/.test(password) && styles.strengthMet]}>{/[0-9]/.test(password) ? '✅' : '☐'} At least 1 number</Text>
            <Text style={[styles.strengthItem, /[!@#$%^&*]/.test(password) && styles.strengthMet]}>{/[!@#$%^&*]/.test(password) ? '✅' : '☐'} At least 1 special (!@#$%^&*)</Text>
          </View>
          {passwordError ? <Text style={styles.inlineError}>{passwordError}</Text> : null}

          <Text style={styles.label}>Confirm Password</Text>
          <View style={[styles.passwordRow, confirmFocused && styles.passwordRowFocused]}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              value={confirmPassword}
              onChangeText={(t) => { setConfirmPassword(t); setConfirmError(null); setSubmitError(null); }}
              onFocus={() => setConfirmFocused(true)}
              onBlur={() => setConfirmFocused(false)}
              placeholder="••••••••"
              placeholderTextColor="#737373"
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirmPassword((p) => !p)}>
              <Text style={styles.eyeIcon}>{showConfirmPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
          {confirmError ? <Text style={styles.inlineError}>{confirmError}</Text> : null}

          <Pressable
            style={[styles.button, (loading || !canSubmitByStrength) && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading || !canSubmitByStrength}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>CREATE ACCOUNT</Text>
            )}
          </Pressable>

          {submitError ? <Text style={styles.error}>{submitError}</Text> : null}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/login" asChild>
              <Pressable>
                <Text style={styles.link}>Login</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: '100%',
  },
  box: {
    width: '100%',
    maxWidth: 390,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#A855F7',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#A3A3A3',
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    fontSize: 12,
    color: '#E5E5E5',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 12, android: 10, default: 10 }),
    color: '#FFFFFF',
    fontSize: 16,
    backgroundColor: '#1A1A1A',
    marginBottom: 6,
  },
  inputFlex: {
    flex: 1,
    marginBottom: 0,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 10,
    backgroundColor: '#1A1A1A',
    paddingRight: 8,
  },
  passwordRowFocused: {
    borderColor: '#8B5CF6',
  },
  eyeBtn: { padding: 8 },
  eyeIcon: { fontSize: 20 },
  strengthBox: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  strengthLabel: {
    fontSize: 11,
    color: '#737373',
    marginBottom: 4,
  },
  strengthItem: {
    fontSize: 12,
    color: '#525252',
    marginBottom: 2,
  },
  strengthMet: {
    color: '#16A34A',
  },
  inputFocused: {
    borderColor: '#8B5CF6',
  },
  inlineError: {
    fontSize: 12,
    color: '#DC2626',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#8B5CF6',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.8,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  error: {
    fontSize: 13,
    color: '#DC2626',
    marginTop: 12,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    flexWrap: 'wrap',
  },
  footerText: {
    fontSize: 14,
    color: '#737373',
  },
  link: {
    fontSize: 14,
    color: '#A855F7',
    fontWeight: '600',
  },
});
