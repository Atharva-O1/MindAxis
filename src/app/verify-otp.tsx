import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { NativeSyntheticEvent, StyleSheet, Text, TextInput, TextInputKeyPressEventData, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useAuth } from '@/context/AuthContext';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

export default function VerifyOtpScreen() {
  const { pendingEmail, verifyOtp, requestOtp, resetToEmailStep } = useAuth();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const inputs = useRef<Array<TextInput | null>>([]);
  const shakeX = useSharedValue(0);

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (!errorMessage) return;
    shakeX.value = withSequence(
      withTiming(-8, { duration: 60 }),
      withTiming(8, { duration: 60 }),
      withTiming(-6, { duration: 60 }),
      withTiming(6, { duration: 60 }),
      withTiming(0, { duration: 60 }),
    );
  }, [errorMessage, shakeX]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  function handleChange(text: string, index: number) {
    const char = text.slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = char;
      return next;
    });
    setErrorMessage(null);

    if (char && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }

    const code = [...digits];
    code[index] = char;
    if (code.every((d) => d.length === 1)) {
      attemptVerify(code.join(''));
    }
  }

  function handleKeyPress(event: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) {
    if (event.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function attemptVerify(code: string) {
    setIsVerifying(true);
    const result = await verifyOtp(code);
    setIsVerifying(false);
    if (!result.success) {
      setErrorMessage(result.error ?? 'Incorrect code. Try again.');
      setDigits(Array(CODE_LENGTH).fill(''));
      inputs.current[0]?.focus();
    }
  }

  async function handleResend() {
    if (cooldown > 0 || !pendingEmail) return;
    setDigits(Array(CODE_LENGTH).fill(''));
    setErrorMessage(null);
    const result = await requestOtp(pendingEmail);
    if (!result.success) {
      setErrorMessage(result.error ?? 'Could not resend the code.');
      return;
    }
    setCooldown(RESEND_COOLDOWN_SECONDS);
    inputs.current[0]?.focus();
  }

  function handleChangeEmail() {
    // Flips the auth status back to 'signedOut' — Stack.Protected reacts to
    // that and swaps this screen out for /login on its own.
    resetToEmailStep();
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={styles.title}>Enter your code</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.email}>{pendingEmail}</Text>
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(80)}
          style={[styles.codeRow, shakeStyle]}
        >
          {digits.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputs.current[index] = ref;
              }}
              style={[
                styles.codeBox,
                errorMessage && styles.codeBoxError,
                digit && styles.codeBoxFilled,
              ]}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(event) => handleKeyPress(event, index)}
              keyboardType="number-pad"
              maxLength={1}
              autoFocus={index === 0}
              editable={!isVerifying}
              textAlign="center"
            />
          ))}
        </Animated.View>

        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        <Animated.View entering={FadeInDown.duration(400).delay(140)} style={styles.demoHint}>
          <MaterialIcons name="info-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.demoHintText}>Demo mode — check the backend console for your code</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.actions}>
          <AnimatedPressable onPress={handleResend} disabled={cooldown > 0} style={styles.resendButton}>
            <Text style={[styles.resendText, cooldown > 0 && styles.resendTextDisabled]}>
              {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
            </Text>
          </AnimatedPressable>

          <AnimatedPressable onPress={handleChangeEmail} style={styles.changeEmailButton}>
            <Text style={styles.changeEmailText}>Change email</Text>
          </AnimatedPressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfaceBright,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.five,
    gap: Spacing.three,
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
  email: {
    color: Colors.textDark,
    fontWeight: '600',
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  codeBox: {
    width: 44,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textDark,
  },
  codeBoxFilled: {
    borderColor: Colors.primary,
  },
  codeBoxError: {
    borderColor: Colors.danger,
  },
  errorText: {
    color: Colors.danger,
    fontSize: FontSize.sm,
    textAlign: 'center',
    fontWeight: '600',
  },
  demoHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  demoHintText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  actions: {
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  resendButton: {
    paddingVertical: Spacing.one,
  },
  resendText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
  },
  resendTextDisabled: {
    color: Colors.textMuted,
  },
  changeEmailButton: {
    paddingVertical: Spacing.one,
  },
  changeEmailText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
});
