import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { BounceIn, FadeInDown } from 'react-native-reanimated';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { CardShadow, Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

const MOCK_JOINED_DATE = 'Joined this session';

export default function ProfileScreen() {
  const router = useRouter();
  const { anonymousId } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View entering={BounceIn.duration(550)} style={styles.avatar}>
          <MaterialIcons name="account-circle" size={72} color={Colors.primary} />
        </Animated.View>

        <Animated.Text entering={FadeInDown.duration(350).delay(100)} style={styles.anonymousId}>
          {anonymousId}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.duration(350).delay(150)} style={styles.joinedDate}>
          {MOCK_JOINED_DATE}
        </Animated.Text>

        <Animated.View entering={FadeInDown.duration(350).delay(200)} style={[styles.infoCard, CardShadow]}>
          <MaterialIcons name="lock" size={18} color={Colors.textMuted} />
          <Text style={styles.infoText}>
            This ID is anonymous and not linked to any personal information. It exists only to
            keep your sessions and check-ins connected across app visits.
          </Text>
        </Animated.View>

        <AnimatedPressable style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeButtonText}>Close</Text>
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
  content: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.five,
    gap: Spacing.two,
  },
  avatar: {
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
  },
  anonymousId: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textDark,
  },
  joinedDate: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.four,
  },
  infoCard: {
    flexDirection: 'row',
    gap: Spacing.two,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  closeButton: {
    marginTop: 'auto',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.six,
    borderRadius: Radius.pill,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: FontSize.md,
  },
});
