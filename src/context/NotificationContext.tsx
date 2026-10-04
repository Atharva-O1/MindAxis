import * as Notifications from 'expo-notifications';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { API_BASE_URL } from '@/constants/config';
import { useAuth } from '@/context/AuthContext';

interface NotificationPreferences {
  enabled: boolean;
  dailyReminderEnabled: boolean;
  reminderTime: string; // "HH:MM" e.g. "20:00"
}

interface NotificationContextType {
  enabled: boolean;
  dailyReminderEnabled: boolean;
  reminderTime: string;
  hasPermission: boolean;
  loading: boolean;
  requestPermission: () => Promise<boolean>;
  updatePreferences: (updates: Partial<NotificationPreferences>) => Promise<boolean>;
  sendTestNotification: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { token, status } = useAuth();
  const [enabled, setEnabled] = useState(true);
  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('20:00');
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check initial permissions
  useEffect(() => {
    if (Platform.OS === 'web') return;
    Notifications.getPermissionsAsync().then(({ status: existingStatus }) => {
      setHasPermission(existingStatus === 'granted');
    });
  }, []);

  // Fetch backend preferences on auth sign-in
  useEffect(() => {
    if (status !== 'signedIn' || !token) return;

    let isMounted = true;
    fetch(`${API_BASE_URL}/notifications/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data) {
          setEnabled(data.enabled);
          setDailyReminderEnabled(data.daily_reminder_enabled);
          setReminderTime(data.reminder_time || '20:00');
          syncLocalSchedule(data.enabled, data.daily_reminder_enabled, data.reminder_time || '20:00');
        }
      })
      .catch((err) => console.log('[Notifications] Failed to load settings:', err));

    return () => {
      isMounted = false;
    };
  }, [status, token]);

  const requestPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'web') return false;
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      const granted = finalStatus === 'granted';
      setHasPermission(granted);
      return granted;
    } catch (e) {
      console.log('[Notifications] Permission request error:', e);
      return false;
    }
  };

  const syncLocalSchedule = async (
    isEnabled: boolean,
    isDailyEnabled: boolean,
    timeStr: string
  ) => {
    if (Platform.OS === 'web') return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      if (!isEnabled || !isDailyEnabled) return;

      const [hStr, mStr] = timeStr.split(':');
      const hour = parseInt(hStr || '20', 10);
      const minute = parseInt(mStr || '0', 10);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'MindAxis Daily Check-In 💙',
          body: 'Take a moment to reflect on your day and log your mood.',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        } as Notifications.DailyTriggerInput,
      });
    } catch (err) {
      console.log('[Notifications] Failed to schedule local notification:', err);
    }
  };

  const updatePreferences = async (
    updates: Partial<NotificationPreferences>
  ): Promise<boolean> => {
    const nextEnabled = updates.enabled ?? enabled;
    const nextDaily = updates.dailyReminderEnabled ?? dailyReminderEnabled;
    const nextTime = updates.reminderTime ?? reminderTime;

    // Optimistic local update
    setEnabled(nextEnabled);
    setDailyReminderEnabled(nextDaily);
    setReminderTime(nextTime);

    // Sync local notification trigger schedule
    await syncLocalSchedule(nextEnabled, nextDaily, nextTime);

    // Sync with backend if signed in
    if (token) {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/notifications/settings`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            enabled: nextEnabled,
            daily_reminder_enabled: nextDaily,
            reminder_time: nextTime,
          }),
        });
        setLoading(false);
        return res.ok;
      } catch (err) {
        console.log('[Notifications] Failed to save settings to backend:', err);
        setLoading(false);
        return false;
      }
    }
    return true;
  };

  const sendTestNotification = async (): Promise<boolean> => {
    if (Platform.OS === 'web') return false;
    try {
      const granted = await requestPermission();
      if (!granted) return false;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'MindAxis Companion 💙',
          body: 'This is a test notification. Daily check-in reminders are working smoothly!',
          sound: true,
        },
        trigger: null, // Instant trigger
      });
      return true;
    } catch (e) {
      console.log('[Notifications] Test notification error:', e);
      return false;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        enabled,
        dailyReminderEnabled,
        reminderTime,
        hasPermission,
        loading,
        requestPermission,
        updatePreferences,
        sendTestNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
