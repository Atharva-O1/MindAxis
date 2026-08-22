import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInLeft, FadeInRight, FadeInUp } from 'react-native-reanimated';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { CrisisBanner } from '@/components/CrisisBanner';
import { TypingIndicator } from '@/components/TypingIndicator';
import { CHAT_WS_URL } from '@/constants/config';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';

type Message = {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  // True while tokens for this bubble are still streaming in.
  streaming?: boolean;
  isError?: boolean;
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    sender: 'ai',
    text: "Hi, I'm here to listen. What's on your mind today?",
  },
];

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket(CHAT_WS_URL);
    wsRef.current = socket;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'token') {
        setIsTyping(false);
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.sender === 'ai' && last.streaming) {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, text: m.text + data.text } : m));
          }
          return [...prev, { id: `ai-${Date.now()}`, sender: 'ai', text: data.text, streaming: true }];
        });
      } else if (data.type === 'done') {
        setIsTyping(false);
        setMessages((prev) =>
          prev.map((m, i) => (i === prev.length - 1 ? { ...m, streaming: false } : m)),
        );
      } else if (data.type === 'error') {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          { id: `err-${Date.now()}`, sender: 'ai', text: data.message, isError: true },
        ]);
      }

      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    };

    socket.onerror = () => setIsTyping(false);

    return () => {
      socket.close();
      wsRef.current = null;
    };
  }, []);

  function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage: Message = { id: Date.now().toString(), sender: 'user', text: trimmed };
    setInput('');
    setMessages((prev) => [...prev, userMessage]);
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));

    const socket = wsRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'ai',
          text: "Not connected to the companion right now. Try reloading the app.",
          isError: true,
        },
      ]);
      return;
    }

    setIsTyping(true);
    socket.send(JSON.stringify({ type: 'user_message', text: trimmed }));
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Animated.View entering={FadeInUp.duration(350)} style={styles.trustBadgeWrap}>
        <View style={styles.trustBadge}>
          <MaterialIcons name="lock" size={14} color={Colors.primary} />
          <Text style={styles.trustBadgeText}>Anonymous · not linked to your identity</Text>
        </View>
      </Animated.View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <Animated.View
            entering={item.sender === 'user' ? FadeInRight.duration(280) : FadeInLeft.duration(280)}
            style={[
              styles.bubble,
              item.sender === 'user' ? styles.userBubble : styles.aiBubble,
              item.isError && styles.errorBubble,
            ]}
          >
            <Text
              style={[
                item.sender === 'user' ? styles.userBubbleText : styles.aiBubbleText,
                item.isError && styles.errorBubbleText,
              ]}
            >
              {item.text}
            </Text>
          </Animated.View>
        )}
        ListFooterComponent={
          <>
            {isTyping && <TypingIndicator />}
            <View style={styles.crisisBannerWrap}>
              <CrisisBanner />
            </View>
          </>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type how you're feeling..."
            placeholderTextColor={Colors.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
          />
          <AnimatedPressable
            onPress={sendMessage}
            style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
            disabled={!input.trim()}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            <MaterialIcons name="arrow-upward" size={20} color={Colors.white} />
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
  trustBadgeWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
  trustBadgeText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  messageList: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginBottom: Spacing.two,
  },
  aiBubble: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: Radius.sm,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: Radius.sm,
  },
  errorBubble: {
    backgroundColor: Colors.dangerSurface,
    borderColor: '#f5c6c2',
  },
  aiBubbleText: {
    color: Colors.textDark,
    fontSize: FontSize.md,
    lineHeight: 21,
  },
  userBubbleText: {
    color: Colors.white,
    fontSize: FontSize.md,
    lineHeight: 21,
  },
  errorBubbleText: {
    color: Colors.danger,
  },
  crisisBannerWrap: {
    marginTop: Spacing.three,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    padding: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: FontSize.md,
    color: Colors.textDark,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.border,
  },
});
