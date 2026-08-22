import { MaterialIcons } from '@expo/vector-icons';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { CardShadow, Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { ChatSession, MOCK_SESSIONS, MoodTag } from '@/data/mockSessions';

const MOOD_STYLES: Record<MoodTag, { label: string; color: string; background: string }> = {
  calm: { label: 'Calm', color: '#1c7a4d', background: '#e4f5ec' },
  okay: { label: 'Okay', color: Colors.primary, background: Colors.surfaceContainerLow },
  anxious: { label: 'Anxious', color: '#b26a00', background: '#fdf1de' },
  low: { label: 'Low', color: '#5b4fc4', background: '#ece9fb' },
  stressed: { label: 'Stressed', color: Colors.danger, background: Colors.dangerSurface },
};

function formatTimestamp(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function SessionRow({ session, index }: { session: ChatSession; index: number }) {
  const mood = MOOD_STYLES[session.mood];
  return (
    <Animated.View entering={FadeInDown.duration(350).delay(index * 60)} style={[styles.row, CardShadow]}>
      <View style={styles.rowIcon}>
        <MaterialIcons name="chat-bubble-outline" size={20} color={Colors.primary} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTimestamp}>{formatTimestamp(session.startedAt)}</Text>
        <Text style={styles.rowDuration}>{session.durationMinutes} min session</Text>
      </View>
      <View style={[styles.moodPill, { backgroundColor: mood.background }]}>
        <Text style={[styles.moodPillText, { color: mood.color }]}>{mood.label}</Text>
      </View>
    </Animated.View>
  );
}

export default function SessionsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={MOCK_SESSIONS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item, index }) => <SessionRow session={item} index={index} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="forum" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No past sessions yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfaceBright,
  },
  list: {
    padding: Spacing.four,
  },
  separator: {
    height: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.three,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: Spacing.half,
  },
  rowTimestamp: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textDark,
  },
  rowDuration: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  moodPill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
  },
  moodPillText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.six,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
});
