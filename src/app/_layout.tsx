import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { JournalProvider } from '@/context/JournalContext';
import { MoodProvider } from '@/context/MoodContext';
import { Colors } from '@/constants/theme';

function RootNavigator() {
  const { status } = useAuth();

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
        <Stack.Screen name="resource-detail" options={{ title: 'Resource' }} />
        <Stack.Screen name="profile" options={{ presentation: 'modal', title: 'Profile' }} />
      </Stack.Protected>

      {/* Always reachable, regardless of auth state — help shouldn't be gated.
          Declared last so it never wins the stack's default initial route. */}
      <Stack.Screen name="crisis-resources" options={{ title: 'Crisis Resources' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <MoodProvider>
        <JournalProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </JournalProvider>
      </MoodProvider>
    </AuthProvider>
  );
}
