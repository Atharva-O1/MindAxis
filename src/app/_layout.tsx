import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, View } from 'react-native';

import { AppointmentProvider } from '@/context/AppointmentContext';
import { AssessmentProvider } from '@/context/AssessmentContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { JournalProvider } from '@/context/JournalContext';
import { MoodProvider } from '@/context/MoodContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { Colors } from '@/constants/theme';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

function RootNavigator() {
  const { status, isHydrating } = useAuth();

  // Wait for the saved session to load before deciding which screen group to
  // show — otherwise a returning signed-in user briefly flashes the login
  // screen before Stack.Protected swaps them onto the tabs.
  if (isHydrating) {
    return <View style={{ flex: 1, backgroundColor: Colors.surfaceBright }} />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.surfaceBright },
        headerTintColor: Colors.textDark,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: Colors.surfaceBright },
      }}
    >
      <Stack.Protected guard={status === 'signedOut'}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={status === 'awaitingOtp'}>
        <Stack.Screen name="verify-otp" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={status === 'signedIn'}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="chat" options={{ title: 'Chat' }} />
        <Stack.Screen name="assessment" options={{ title: 'PHQ-9 Check-in' }} />
        <Stack.Screen name="gad7" options={{ title: 'GAD-7 Check-in' }} />
        <Stack.Screen name="mood-tracker" options={{ title: 'Mood Check-in' }} />
        <Stack.Screen name="journal" options={{ title: 'Journal' }} />
        <Stack.Screen name="journal-entry" options={{ title: 'Journal Entry' }} />
        <Stack.Screen name="appointments" options={{ title: 'Campus Counselor' }} />
        <Stack.Screen name="counselors" options={{ title: 'Campus Counseling' }} />
        <Stack.Screen name="resource-detail" options={{ title: 'Resource' }} />
        <Stack.Screen name="profile" options={{ presentation: 'modal', title: 'Profile' }} />
      </Stack.Protected>

      {/* Always reachable, regardless of auth state */}
      <Stack.Screen name="counselor-login" options={{ title: 'Counselor Login' }} />
      <Stack.Screen name="counselor-portal" options={{ title: 'Counselor Schedule', headerLeft: () => null }} />
      <Stack.Screen name="crisis-resources" options={{ title: 'Crisis Resources' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppointmentProvider>
          <MoodProvider>
            <JournalProvider>
              <AssessmentProvider>
                <StatusBar style="dark" />
                <RootNavigator />
              </AssessmentProvider>
            </JournalProvider>
          </MoodProvider>
        </AppointmentProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}


