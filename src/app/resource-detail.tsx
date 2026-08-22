import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { getResource } from '@/data/resources';

export default function ResourceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const resource = getResource(id);

  if (!resource) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>Resource not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: resource.category }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{resource.title}</Text>
        <Text style={styles.meta}>{resource.minutes} min read</Text>

        {resource.body.map((paragraph, index) => (
          <Text key={index} style={styles.paragraph}>
            {paragraph}
          </Text>
        ))}

        {resource.category === 'Support' && (
          <AnimatedPressable
            style={styles.crisisButton}
            onPress={() => router.push('/crisis-resources')}
          >
            <MaterialIcons name="favorite" size={18} color={Colors.white} />
            <Text style={styles.crisisButtonText}>View crisis helplines</Text>
          </AnimatedPressable>
        )}
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
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textDark,
  },
  meta: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: -Spacing.two,
  },
  paragraph: {
    fontSize: FontSize.md,
    color: Colors.textDark,
    lineHeight: 24,
  },
  crisisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: Colors.danger,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.three,
    marginTop: Spacing.two,
  },
  crisisButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: FontSize.md,
  },
  notFound: {
    padding: Spacing.four,
    color: Colors.textMuted,
    fontSize: FontSize.md,
  },
});
