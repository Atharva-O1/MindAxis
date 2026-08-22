import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { CardShadow, Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { JournalEntry, useJournal } from '@/context/JournalContext';

function formatDate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function EntryRow({ entry, index, onPress }: { entry: JournalEntry; index: number; onPress: () => void }) {
  const heading = entry.title.trim() || entry.body.trim().split('\n')[0] || 'Untitled entry';
  return (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 50)}>
      <AnimatedPressable style={[styles.row, CardShadow]} onPress={onPress}>
        <View style={styles.rowIcon}>
          <MaterialIcons name="menu-book" size={20} color={Colors.primary} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {heading}
          </Text>
          <Text style={styles.rowPreview} numberOfLines={1}>
            {entry.body.trim() || 'No content yet'}
          </Text>
          <Text style={styles.rowDate}>{formatDate(entry.updatedAt)}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function JournalScreen() {
  const router = useRouter();
  const { entries } = useJournal();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item, index }) => (
          <EntryRow
            entry={item}
            index={index}
            onPress={() => router.push({ pathname: '/journal-entry', params: { id: item.id } })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="menu-book" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No journal entries yet</Text>
          </View>
        }
      />

      <View style={styles.newButtonWrap}>
        <AnimatedPressable
          style={styles.newButton}
          onPress={() => router.push('/journal-entry')}
          accessibilityRole="button"
          accessibilityLabel="New journal entry"
        >
          <MaterialIcons name="add" size={22} color={Colors.white} />
          <Text style={styles.newButtonText}>New entry</Text>
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
  list: {
    padding: Spacing.four,
    paddingBottom: Spacing.six + Spacing.four,
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
  rowTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textDark,
  },
  rowPreview: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  rowDate: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.half,
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
  newButtonWrap: {
    position: 'absolute',
    left: Spacing.four,
    right: Spacing.four,
    bottom: Spacing.four,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.three,
    shadowColor: Colors.primaryDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  newButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: FontSize.md,
  },
});
