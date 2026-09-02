import { MaterialIcons } from '@expo/vector-icons';
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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { CardShadow, Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { getMoodOption, MOOD_SCALE, MoodLevel } from '@/constants/moods';
import { useMood } from '@/context/MoodContext';

function formatRelativeTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const time = date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  if (isToday) return `Today, ${time}`;
  const isYesterday =
    new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toDateString() ===
    date.toDateString();
  if (isYesterday) return `Yesterday, ${time}`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + `, ${time}`;
}

function MoodOptionButton({
  level,
  selected,
  onPress,
}: {
  level: MoodLevel;
  selected: boolean;
  onPress: () => void;
}) {
  const option = getMoodOption(level);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePress() {
    scale.value = withSpring(1.15, {}, () => {
      scale.value = withSpring(1);
    });
    onPress();
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[
        styles.moodOption,
        selected && { backgroundColor: option.background, borderColor: option.color },
      ]}
    >
      <Animated.Text style={[styles.moodEmoji, animatedStyle]}>{option.emoji}</Animated.Text>
      <Text style={[styles.moodLabel, selected && { color: option.color, fontWeight: '700' }]}>
        {option.label}
      </Text>
    </AnimatedPressable>
  );
}

export default function MoodTrackerScreen() {
  const router = useRouter();
  const { entries, logMood } = useMood();
  const [selected, setSelected] = useState<MoodLevel | null>(null);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSave() {
    if (!selected || isSaving) return;
    setIsSaving(true);
    setErrorMessage(null);
    const result = await logMood(selected, note.trim());
    setIsSaving(false);
    if (!result.success) {
      setErrorMessage(result.error ?? 'Could not save your check-in.');
      return;
    }
    router.back();
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={styles.title}>How are you feeling?</Text>
            <Text style={styles.subtitle}>Log a quick mood check-in — takes 10 seconds.</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(80)} style={styles.moodRow}>
            {MOOD_SCALE.map((option) => (
              <MoodOptionButton
                key={option.level}
                level={option.level}
                selected={selected === option.level}
                onPress={() => setSelected(option.level)}
              />
            ))}
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(140)}>
            <Text style={styles.label}>Add a note (optional)</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="What's on your mind?"
              placeholderTextColor={Colors.textMuted}
              value={note}
              onChangeText={setNote}
              multiline
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(200)}>
            {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
            <AnimatedPressable
              style={[styles.saveButton, (!selected || isSaving) && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!selected || isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save check-in</Text>
              )}
            </AnimatedPressable>
          </Animated.View>

          {entries.length > 0 && (
            <Animated.View entering={FadeInDown.duration(400).delay(260)} style={styles.history}>
              <Text style={styles.historyTitle}>Recent check-ins</Text>
              {entries.slice(0, 5).map((entry) => {
                const option = getMoodOption(entry.level);
                return (
                  <View key={entry.id} style={[styles.historyRow, CardShadow]}>
                    <Text style={styles.historyEmoji}>{option.emoji}</Text>
                    <View style={styles.historyText}>
                      <Text style={styles.historyLabel}>{option.label}</Text>
                      <Text style={styles.historyTime}>{formatRelativeTime(entry.loggedAt)}</Text>
                    </View>
                  </View>
                );
              })}
            </Animated.View>
          )}
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
    padding: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textDark,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.half,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  moodOption: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.three,
    marginHorizontal: Spacing.half,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  moodEmoji: {
    fontSize: 28,
  },
  moodLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.two,
  },
  noteInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: FontSize.md,
    color: Colors.textDark,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: Colors.danger,
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: FontSize.md,
  },
  history: {
    marginTop: Spacing.two,
    gap: Spacing.two,
  },
  historyTitle: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.one,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  historyEmoji: {
    fontSize: 22,
  },
  historyText: {
    gap: Spacing.half,
  },
  historyLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textDark,
  },
  historyTime: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
});
