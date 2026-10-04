import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ReactNode, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { CrisisBanner } from '@/components/CrisisBanner';
import { CardShadow, Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';

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

function formatTime(timeStr: string): string {
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr || '20', 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${ampm}`;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { anonymousId, logout } = useAuth();
  const {
    enabled,
    dailyReminderEnabled,
    reminderTime,
    updatePreferences,
    sendTestNotification,
    requestPermission,
  } = useNotifications();

  const handleNotificationsToggle = async (val: boolean): Promise<void> => {
    if (val) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Permission Needed',
          'Notification permissions are required to receive reminders.'
        );
      }
    }
    await updatePreferences({ enabled: val });
  };

  const handleCycleTime = () => {
    // Cycle between popular reminder times: 09:00, 20:00, 21:30
    const times = ['09:00', '20:00', '21:30'];
    const currentIndex = times.indexOf(reminderTime);
    const nextTime = times[(currentIndex + 1) % times.length];
    updatePreferences({ reminderTime: nextTime });
  };

  const handleTestNotification = async () => {
    const sent = await sendTestNotification();
    if (sent) {
      Alert.alert('Test Notification Sent', 'A test reminder has been triggered!');
    } else {
      Alert.alert(
        'Permission Disabled',
        'Could not send test notification. Please enable notification permissions.'
      );
    }
  };

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
                  value={enabled}
                  onValueChange={(val) => {
                    handleNotificationsToggle(val);
                  }}
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
                  value={dailyReminderEnabled}
                  disabled={!enabled}
                  onValueChange={(val) => {
                    updatePreferences({ dailyReminderEnabled: val });
                  }}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                />
              }
            />
            {enabled && dailyReminderEnabled && (
              <>
                <View style={styles.divider} />
                <SettingsRow
                  icon="schedule"
                  label="Reminder time"
                  value={formatTime(reminderTime)}
                  onPress={handleCycleTime}
                />
              </>
            )}
            <View style={styles.divider} />
            <SettingsRow
              icon="notifications-active"
              label="Send test reminder"
              onPress={handleTestNotification}
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
