import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ReactNode, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { CrisisBanner } from '@/components/CrisisBanner';
import { CardShadow, Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  rightElement,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: ReactNode;
}) {
  return (
    <AnimatedPressable style={styles.row} onPress={onPress} disabled={!onPress}>
      <MaterialIcons name={icon} size={20} color={Colors.textMuted} style={styles.rowIcon} />
      <Text style={styles.rowLabel}>{label}</Text>
      {rightElement ?? (
        <>
          {value && <Text style={styles.rowValue}>{value}</Text>}
          {onPress && <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />}
        </>
      )}
    </AnimatedPressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { anonymousId, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInDown.duration(350)}>
          <SectionLabel>Anonymous Session</SectionLabel>
          <View style={[styles.card, CardShadow]}>
            <SettingsRow
              icon="fingerprint"
              label="Session ID"
              value={anonymousId ?? undefined}
            />
            <View style={styles.divider} />
            <SettingsRow icon="badge" label="View profile" onPress={() => router.push('/profile')} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(350).delay(60)}>
          <SectionLabel>Preferences</SectionLabel>
          <View style={[styles.card, CardShadow]}>
            <SettingsRow
              icon="notifications"
              label="Notifications"
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                />
              }
            />
            <View style={styles.divider} />
            <SettingsRow
              icon="alarm"
              label="Daily check-in reminder"
              rightElement={
                <Switch
                  value={dailyReminder}
                  onValueChange={setDailyReminder}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                />
              }
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(350).delay(120)}>
          <SectionLabel>Privacy &amp; Safety</SectionLabel>
          <View style={[styles.card, CardShadow]}>
            <SettingsRow
              icon="shield"
              label="How your data is protected"
              onPress={() => {}}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon="favorite"
              label="Crisis resources"
              onPress={() => router.push('/crisis-resources')}
            />
          </View>
        </Animated.View>

        <View style={styles.bannerWrap}>
          <CrisisBanner />
        </View>

        <Animated.View entering={FadeInDown.duration(350).delay(180)}>
          <SectionLabel>About</SectionLabel>
          <View style={[styles.card, CardShadow]}>
            <SettingsRow icon="info" label="Version" value="1.0.0 (college project)" />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(350).delay(240)}>
          <View style={[styles.card, CardShadow]}>
            <AnimatedPressable style={styles.row} onPress={logout}>
              <MaterialIcons name="logout" size={20} color={Colors.danger} style={styles.rowIcon} />
              <Text style={[styles.rowLabel, styles.logoutLabel]}>Log out</Text>
            </AnimatedPressable>
          </View>
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
    gap: Spacing.two,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
    marginLeft: Spacing.one,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  rowIcon: {
    width: 22,
  },
  rowLabel: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textDark,
  },
  rowValue: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginRight: Spacing.one,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: Spacing.three + 22 + Spacing.three,
  },
  bannerWrap: {
    marginTop: Spacing.three,
  },
  logoutLabel: {
    color: Colors.danger,
    fontWeight: '600',
  },
});
