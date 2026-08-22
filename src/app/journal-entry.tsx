import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { useJournal } from '@/context/JournalContext';

export default function JournalEntryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { getEntry, addEntry, updateEntry, deleteEntry } = useJournal();
  const existing = id ? getEntry(id) : undefined;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [body, setBody] = useState(existing?.body ?? '');

  function handleSave() {
    if (!body.trim()) return;
    if (existing) {
      updateEntry(existing.id, title.trim(), body.trim());
    } else {
      addEntry(title.trim(), body.trim());
    }
    router.back();
  }

  function handleDelete() {
    if (!existing) return;
    Alert.alert('Delete entry?', 'This can’t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteEntry(existing.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <TextInput
            style={styles.titleInput}
            placeholder="Title (optional)"
            placeholderTextColor={Colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={styles.bodyInput}
            placeholder="Write what's on your mind..."
            placeholderTextColor={Colors.textMuted}
            value={body}
            onChangeText={setBody}
            multiline
            autoFocus={!existing}
            textAlignVertical="top"
          />
        </ScrollView>

        <View style={styles.actions}>
          {existing && (
            <AnimatedPressable style={styles.deleteButton} onPress={handleDelete}>
              <MaterialIcons name="delete-outline" size={18} color={Colors.danger} />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </AnimatedPressable>
          )}
          <AnimatedPressable
            style={[styles.saveButton, !body.trim() && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!body.trim()}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </AnimatedPressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfaceBright,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    flexGrow: 1,
  },
  titleInput: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textDark,
    paddingVertical: Spacing.two,
  },
  bodyInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textDark,
    lineHeight: 22,
    minHeight: 200,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.four,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.dangerSurface,
    backgroundColor: Colors.dangerSurface,
  },
  deleteButtonText: {
    color: Colors.danger,
    fontWeight: '600',
    fontSize: FontSize.sm,
  },
  saveButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: FontSize.md,
  },
});
