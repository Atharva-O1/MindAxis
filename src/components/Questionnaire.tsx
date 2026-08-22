import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  BounceIn,
  FadeInDown,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { CardShadow, Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { AssessmentType, useAssessments } from '@/context/AssessmentContext';

const OPTIONS = [
  { label: 'Not at all', value: 0 },
  { label: 'Several days', value: 1 },
  { label: 'More than half the days', value: 2 },
  { label: 'Nearly every day', value: 3 },
];

type QuestionnaireProps = {
  type: AssessmentType;
  questions: string[];
  promptText?: string;
};

function ProgressBar({ progress }: { progress: number }) {
  const width = useSharedValue(progress);

  useEffect(() => {
    width.value = withTiming(progress, { duration: 350 });
  }, [progress, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, animatedStyle]} />
    </View>
  );
}

// Shared question-flow UI for any 4-point (0-3), 0/1/2/3-scored self-report
// questionnaire — used by both the PHQ-9 and GAD-7 screens.
export function Questionnaire({
  type,
  questions,
  promptText = 'Over the last 2 weeks, how often have you been bothered by:',
}: QuestionnaireProps) {
  const router = useRouter();
  const { addResult } = useAssessments();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [completed, setCompleted] = useState(false);

  const progress = (step + 1) / questions.length;
  const currentAnswer = answers[step];
  const maxScore = questions.length * 3;

  function selectAnswer(value: number) {
    setAnswers((prev) => prev.map((a, i) => (i === step ? value : a)));
  }

  function goNext() {
    if (step < questions.length - 1) {
      setStep((s) => s + 1);
    } else {
      const total = answers.reduce<number>((sum, a) => sum + (a ?? 0), 0);
      addResult(type, total, maxScore);
      setCompleted(true);
    }
  }

  function goBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  if (completed) {
    const total = answers.reduce<number>((sum, a) => sum + (a ?? 0), 0);
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.completeWrap}>
          <Animated.View entering={BounceIn.duration(600)}>
            <MaterialIcons name="check-circle" size={48} color={Colors.success} />
          </Animated.View>
          <Animated.Text entering={FadeInDown.duration(400).delay(150)} style={styles.completeTitle}>
            Check-in complete
          </Animated.Text>
          <Animated.Text entering={FadeInDown.duration(400).delay(220)} style={styles.completeScore}>
            Score: {total} / {maxScore}
          </Animated.Text>
          <Animated.Text entering={FadeInDown.duration(400).delay(290)} style={styles.completeNote}>
            This is a self-reflection tool, not a diagnosis. If you&apos;re struggling, please
            reach out to a helpline or someone you trust.
          </Animated.Text>
          <Animated.View entering={FadeInDown.duration(400).delay(360)}>
            <AnimatedPressable style={styles.doneButton} onPress={() => router.back()}>
              <Text style={styles.doneButtonText}>Done</Text>
            </AnimatedPressable>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ProgressBar progress={progress} />
      <Text style={styles.stepLabel}>
        Question {step + 1} of {questions.length}
      </Text>

      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View key={step} entering={SlideInRight.duration(300)}>
          <Text style={styles.prompt}>{promptText}</Text>
          <Text style={styles.question}>{questions[step]}</Text>

          <View style={styles.optionsGroup}>
            {OPTIONS.map((option, index) => {
              const selected = currentAnswer === option.value;
              return (
                <Animated.View key={option.value} entering={FadeInDown.duration(300).delay(60 * index)}>
                  <AnimatedPressable
                    style={[styles.optionRow, selected && styles.optionRowSelected]}
                    onPress={() => selectAnswer(option.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                      {selected && <View style={styles.radioInner} />}
                    </View>
                    <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                      {option.label}
                    </Text>
                  </AnimatedPressable>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      <View style={styles.navRow}>
        <AnimatedPressable
          style={[styles.navButton, styles.navButtonSecondary]}
          onPress={goBack}
          disabled={step === 0}
        >
          <Text
            style={[
              styles.navButtonText,
              styles.navButtonTextSecondary,
              step === 0 && styles.navDisabledText,
            ]}
          >
            Back
          </Text>
        </AnimatedPressable>
        <AnimatedPressable
          style={[
            styles.navButton,
            styles.navButtonPrimary,
            currentAnswer === null && styles.navButtonDisabled,
          ]}
          onPress={goNext}
          disabled={currentAnswer === null}
        >
          <Text style={styles.navButtonText}>{step === questions.length - 1 ? 'Finish' : 'Next'}</Text>
        </AnimatedPressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfaceBright,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.surfaceContainerLow,
    marginHorizontal: Spacing.four,
    marginTop: Spacing.three,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
  },
  stepLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.two,
    marginHorizontal: Spacing.four,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  prompt: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  question: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textDark,
    marginTop: Spacing.two,
    marginBottom: Spacing.three,
  },
  optionsGroup: {
    gap: Spacing.two,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    ...CardShadow,
    shadowOpacity: 0.04,
  },
  optionRowSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceContainerLow,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  optionLabel: {
    fontSize: FontSize.md,
    color: Colors.textDark,
  },
  optionLabelSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  navRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  navButton: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
    alignItems: 'center',
  },
  navButtonPrimary: {
    backgroundColor: Colors.primary,
  },
  navButtonSecondary: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: FontSize.md,
  },
  navButtonTextSecondary: {
    color: Colors.textDark,
  },
  navDisabledText: {
    color: Colors.textMuted,
  },
  completeWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
    gap: Spacing.two,
  },
  completeTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textDark,
    marginTop: Spacing.two,
  },
  completeScore: {
    fontSize: FontSize.lg,
    color: Colors.primary,
    fontWeight: '600',
  },
  completeNote: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginVertical: Spacing.three,
    lineHeight: 20,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.six,
    borderRadius: Radius.pill,
  },
  doneButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: FontSize.md,
  },
});
