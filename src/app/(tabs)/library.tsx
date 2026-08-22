import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { CardShadow, Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { Resource, RESOURCE_CATEGORIES, RESOURCES } from '@/data/resources';

const CATEGORY_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  'Breathing & Grounding': 'self-improvement',
  'Managing Stress': 'psychology',
  'Sleep & Rest': 'bedtime',
  Support: 'favorite',
};

function ResourceRow({ resource, index }: { resource: Resource; index: number }) {
  const router = useRouter();
  return (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 40)}>
      <AnimatedPressable
        style={[styles.row, CardShadow]}
        onPress={() => router.push({ pathname: '/resource-detail', params: { id: resource.id } })}
      >
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>{resource.title}</Text>
          <Text style={styles.rowSummary} numberOfLines={2}>
            {resource.summary}
          </Text>
          <Text style={styles.rowMeta}>{resource.minutes} min read</Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function LibraryScreen() {
  const sections = RESOURCE_CATEGORIES.map((category) => ({
    title: category,
    data: RESOURCES.filter((resource) => resource.category === category),
  }));

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <MaterialIcons
              name={CATEGORY_ICONS[section.title] ?? 'menu-book'}
              size={16}
              color={Colors.primary}
            />
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item, index }) => <ResourceRow resource={item} index={index} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        SectionSeparatorComponent={() => <View style={styles.sectionSeparator} />}
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionSeparator: {
    height: Spacing.four,
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
  rowText: {
    flex: 1,
    gap: Spacing.half,
  },
  rowTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textDark,
  },
  rowSummary: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  rowMeta: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.half,
  },
});
