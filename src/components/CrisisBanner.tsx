import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';

export function CrisisBanner() {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push('/crisis-resources')}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel="In crisis? View helpline numbers"
    >
      <View style={styles.left}>
        <MaterialIcons name="favorite" size={18} color={Colors.danger} />
        <Text style={styles.text}>In crisis? Get help now</Text>
      </View>
      <MaterialIcons name="chevron-right" size={20} color={Colors.danger} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dangerSurface,
    borderRadius: Radius.md,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderColor: '#f5c6c2',
  },
  pressed: {
    opacity: 0.7,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  text: {
    color: Colors.danger,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
