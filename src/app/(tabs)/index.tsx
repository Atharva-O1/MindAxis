import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { CrisisBanner } from '@/components/CrisisBanner';
import { CardShadow, Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { getMoodOption } from '@/constants/moods';
import { useMood } from '@/context/MoodContext';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const router = useRouter();
  const { todaysEntry } = useMood();
  const moodOption = todaysEntry ? getMoodOption(todaysEntry.level) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.subGreeting}>How are you feeling today?</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(80)}>
          <CrisisBanner />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(120)}>
          <AnimatedPressable
            onPress={() => router.push('/mood-tracker')}
            style={[styles.card, CardShadow, moodOption && { backgroundColor: moodOption.background }]}
          >
            <View style={[styles.cardIcon, styles.cardIconMuted]}>
              <Text style={styles.moodEmoji}>{moodOption ? moodOption.emoji : '🙂'}</Text>
            </View>
            <View style={styles.cardTextGroup}>
              <Text style={styles.cardTitle}>
                {moodOption ? `Today: ${moodOption.label}` : 'Log your mood'}
              </Text>
              <Text style={styles.cardSubtitle}>
                {moodOption ? 'Tap to log another check-in' : 'A quick 10-second check-in'}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={Colors.textMuted} />
          </AnimatedPressable>
        </Animated.View>

        <AnimatedPressable
          onPress={() => router.push('/chat')}
          style={styles.primaryCardWrap}
        >
          <Animated.View entering={FadeInUp.duration(450).delay(140)}>
            <LinearGradient
              colors={[Colors.primaryLight, Colors.primary, Colors.primaryDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.card, styles.primaryCard]}
            >
              <View style={styles.cardIcon}>
                <MaterialIcons name="chat-bubble" size={24} color={Colors.white} />
              </View>
              <View style={styles.cardTextGroup}>
                <Text style={styles.primaryCardTitle}>Talk to your companion</Text>
                <Text style={styles.primaryCardSubtitle}>
                  A private space to share what&apos;s on your mind
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={Colors.white} />
            </LinearGradient>
          </Animated.View>
        </AnimatedPressable>

        <Animated.View entering={FadeInUp.duration(450).delay(200)}>
          <Text style={styles.sectionLabel}>Assessments</Text>
          <View style={styles.assessmentRow}>
            <AnimatedPressable
              onPress={() => router.push('/assessment')}
              style={[styles.assessmentCard, CardShadow]}
            >
              <MaterialIcons name="fact-check" size={22} color={Colors.primary} />
              <Text style={styles.assessmentTitle}>PHQ-9</Text>
              <Text style={styles.assessmentSubtitle}>Depression check-in</Text>
            </AnimatedPressable>
            <AnimatedPressable
              onPress={() => router.push('/gad7')}
              style={[styles.assessmentCard, CardShadow]}
            >
              <MaterialIcons name="waves" size={22} color={Colors.primary} />
              <Text style={styles.assessmentTitle}>GAD-7</Text>
              <Text style={styles.assessmentSubtitle}>Anxiety check-in</Text>
            </AnimatedPressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(450).delay(230)}>
          <AnimatedPressable
            onPress={() => router.push('/journal')}
            style={[styles.card, CardShadow]}
          >
            <View style={[styles.cardIcon, styles.cardIconMuted]}>
              <MaterialIcons name="menu-book" size={24} color={Colors.primary} />
            </View>
            <View style={styles.cardTextGroup}>
              <Text style={styles.cardTitle}>Journal</Text>
              <Text style={styles.cardSubtitle}>Write down what&apos;s on your mind</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={Colors.textMuted} />
          </AnimatedPressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(280)} style={styles.privacyNote}>
          <MaterialIcons name="lock" size={16} color={Colors.textMuted} />
          <Text style={styles.privacyText}>
            Your identity is never linked to what you share here.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfaceBright,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    marginBottom: Spacing.two,
  },
  greeting: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textDark,
  },
  subGreeting: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    marginTop: Spacing.half,
  },
  primaryCardWrap: {
    borderRadius: Radius.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.three,
  },
  primaryCard: {
    borderWidth: 0,
    shadowColor: Colors.primaryDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconMuted: {
    backgroundColor: Colors.surfaceContainerLow,
  },
  moodEmoji: {
    fontSize: 22,
  },
  cardTextGroup: {
    flex: 1,
    gap: Spacing.half,
  },
  primaryCardTitle: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  primaryCardSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: FontSize.xs,
  },
  cardTitle: {
    color: Colors.textDark,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.two,
    marginLeft: Spacing.one,
  },
  assessmentRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  assessmentCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  assessmentTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textDark,
    marginTop: Spacing.one,
  },
  assessmentSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    justifyContent: 'center',
    marginTop: Spacing.four,
  },
  privacyText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
});
