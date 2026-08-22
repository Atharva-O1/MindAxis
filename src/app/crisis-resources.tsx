import { MaterialIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { CardShadow, Colors, FontSize, Radius, Spacing } from '@/constants/theme';

type Helpline = {
  name: string;
  description: string;
  phone: string;
};

const HELPLINES: Helpline[] = [
  {
    name: 'Kiran',
    description: '24/7 national mental health helpline (Govt. of India)',
    phone: '1800-599-0019',
  },
  {
    name: 'iCall',
    description: 'Psychosocial helpline by TISS, Mon–Sat 10am–8pm',
    phone: '9152987821',
  },
  {
    name: 'AASRA',
    description: '24/7 helpline for those in emotional distress',
    phone: '9820466726',
  },
];

function callNumber(phone: string) {
  const digits = phone.replace(/[^\d+]/g, '');
  Linking.openURL(`tel:${digits}`);
}

export default function CrisisResourcesScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Crisis Resources' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <MaterialIcons name="favorite" size={28} color={Colors.danger} />
          <Text style={styles.title}>You&apos;re not alone</Text>
          <Text style={styles.subtitle}>
            If you&apos;re in immediate danger, please call one of these helplines or reach out
            to someone you trust. These services are free and confidential.
          </Text>
        </View>

        {HELPLINES.map((helpline, index) => (
          <Animated.View
            key={helpline.name}
            entering={FadeInDown.duration(350).delay(index * 80)}
            style={[styles.card, CardShadow]}
          >
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{helpline.name}</Text>
              <Text style={styles.cardDescription}>{helpline.description}</Text>
            </View>
            <AnimatedPressable
              onPress={() => callNumber(helpline.phone)}
              style={styles.callButton}
              accessibilityRole="button"
              accessibilityLabel={`Call ${helpline.name} at ${helpline.phone}`}
            >
              <MaterialIcons name="call" size={16} color={Colors.white} />
              <Text style={styles.callButtonText}>{helpline.phone}</Text>
            </AnimatedPressable>
          </Animated.View>
        ))}

        <Text style={styles.footnote}>
          This screen is informational only. MindAxis does not provide emergency response or
          human-monitored crisis intervention.
        </Text>
      </ScrollView>
    </View>
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
  intro: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textDark,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  cardText: {
    gap: Spacing.half,
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textDark,
  },
  cardDescription: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: Colors.danger,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.two,
  },
  callButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: FontSize.sm,
  },
  footnote: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.three,
  },
});
