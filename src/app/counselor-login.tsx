import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { API_BASE_URL } from '@/constants/config';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { saveJSON } from '@/lib/storage';

export const COUNSELOR_SESSION_KEY = 'mindaxis.auth.counselor';

const COUNSELORS_LIST = [
  { name: 'Dr. Ananya Sharma', title: 'Senior Clinical Psychologist', location: 'Room 204' },
  { name: 'Prof. Rajesh Kumar', title: 'Student Wellness Counselor', location: 'Room 102' },
  { name: 'Dr. Priya Nair', title: 'Mental Health Specialist', location: 'Room 308' },
];

export default function CounselorLoginScreen() {
  const router = useRouter();
  const [counselorName, setCounselorName] = useState(COUNSELORS_LIST[0].name);
  const [accessKey, setAccessKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin() {
    if (isSubmitting) return;
    if (!counselorName.trim()) {
      setError('Please enter or select your Counselor Name');
      return;
    }
    if (!accessKey.trim()) {
      setError('Please enter your Counselor Access Key');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/counselor-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          counselor_name: counselorName.trim(),
          counselor_key: accessKey.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      setIsSubmitting(false);

      if (!res.ok) {
        setError(data.detail || 'Invalid Counselor Access Key');
        return;
      }

      await saveJSON(COUNSELOR_SESSION_KEY, {
        token: data.token,
        counselorName: data.counselor_name,
      });

      router.replace('/counselor-portal');
    } catch {
      setIsSubmitting(false);
      setError('Could not connect to backend server');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Animated.View entering={FadeInDown.duration(450)} style={styles.header}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.badgeMark}
            >
              <MaterialIcons name="medical-services" size={32} color={Colors.white} />
            </LinearGradient>
            <Text style={styles.title}>Counselor Portal</Text>
            <Text style={styles.subtitle}>
              Access your confidential appointment schedule & manage campus student sessions securely.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(450).delay(100)} style={styles.section}>
            <Text style={styles.label}>Counselor Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name (e.g. Dr. Atharva Ramteke)"
              placeholderTextColor={Colors.textMuted}
              value={counselorName}
              onChangeText={(t) => {
                setCounselorName(t);
                if (error) setError(null);
              }}
            />

            <Text style={[styles.label, { marginTop: Spacing.two }]}>Or Select Campus Profile</Text>
            {COUNSELORS_LIST.map((c) => (
              <TouchableOpacity
                key={c.name}
                style={[
                  styles.counselorCard,
                  counselorName.trim() === c.name && styles.counselorCardSelected,
                ]}
                onPress={() => {
                  setCounselorName(c.name);
                  if (error) setError(null);
                }}
              >
                <View style={styles.counselorCardText}>
                  <Text
                    style={[
                      styles.counselorName,
                      counselorName.trim() === c.name && styles.counselorNameSelected,
                    ]}
                  >
                    {c.name}
                  </Text>
                  <Text style={styles.counselorTitle}>
                    {c.title} • {c.location}
                  </Text>
                </View>
                {counselorName.trim() === c.name && (
                  <MaterialIcons name="check-circle" size={24} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(450).delay(180)} style={styles.section}>
            <Text style={styles.label}>Access Key</Text>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              placeholder="Enter Access Key (MINDAXIS26)"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              value={accessKey}
              onChangeText={(t) => {
                setAccessKey(t);
                if (error) setError(null);
              }}
              onSubmitEditing={handleLogin}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <AnimatedPressable
              style={[styles.loginButton, isSubmitting && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>Sign In to Dashboard</Text>
                  <MaterialIcons name="arrow-forward" size={18} color={Colors.white} />
                </>
              )}
            </AnimatedPressable>
          </Animated.View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace('/login');
            }}
          >
            <MaterialIcons name="arrow-back" size={16} color={Colors.textMuted} />
            <Text style={styles.backButtonText}>Return to Student Sign In</Text>
          </TouchableOpacity>
        </ScrollView>
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
    padding: Spacing.five,
    gap: Spacing.four,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  badgeMark: {
    width: 64,
    height: 64,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textDark,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    gap: Spacing.two,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  counselorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  counselorCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceContainerLow,
  },
  counselorCardText: {
    gap: 2,
  },
  counselorName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textDark,
  },
  counselorNameSelected: {
    color: Colors.primary,
  },
  counselorTitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  input: {
    height: 48,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    fontSize: FontSize.md,
    color: Colors.textDark,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    marginTop: 2,
  },
  loginButton: {
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.white,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    marginTop: Spacing.two,
  },
  backButtonText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
});
