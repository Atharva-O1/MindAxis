import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useAuth } from '@/context/AuthContext';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const router = useRouter();
  const { requestOtp } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleContinue() {
    if (isSubmitting) return;
    const trimmed = email.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setError('Enter a valid email address');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    const result = await requestOtp(trimmed);
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error ?? 'Something went wrong.');
      return;
    }
    router.push('/verify-otp');
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.duration(450)} style={styles.brandRow}>
            <LinearGradient
              colors={[Colors.primaryLight, Colors.primary, Colors.primaryDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.brandMark}
            >
              <MaterialIcons name="spa" size={28} color={Colors.white} />
            </LinearGradient>
            <Text style={styles.brandName}>MindAxis</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(450).delay(80)}>
            <Text style={styles.title}>Verify you&apos;re a student</Text>
            <Text style={styles.subtitle}>
              Enter your college email to get a one-time code. We only use it to confirm
              eligibility — it&apos;s never linked to your chats or check-ins.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(450).delay(160)} style={styles.form}>
            <Text style={styles.label}>College email</Text>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              placeholder="you@college.ac.in"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}

            <AnimatedPressable
              style={[styles.continueButton, isSubmitting && styles.continueButtonDisabled]}
              onPress={handleContinue}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <>
                  <Text style={styles.continueButtonText}>Send code</Text>
                  <MaterialIcons name="arrow-forward" size={18} color={Colors.white} />
                </>
              )}
            </AnimatedPressable>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(400).delay(220)} style={styles.privacyNote}>
            <MaterialIcons name="lock" size={16} color={Colors.textMuted} />
            <Text style={styles.privacyText}>
              Your identity is never stored alongside clinical or session data.
            </Text>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfaceBright,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.five,
    gap: Spacing.four,
  },
  brandRow: {
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  brandMark: {
    width: 56,
    height: 56,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textDark,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textDark,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: Spacing.two,
  },
  form: {
    gap: Spacing.two,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: Spacing.one,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: FontSize.md,
    color: Colors.textDark,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    marginLeft: Spacing.one,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.three,
    marginTop: Spacing.two,
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  continueButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: FontSize.md,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  privacyText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'center',
    flexShrink: 1,
  },
});
