import React, { useState, useRef, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../theme/ThemeProvider';

const BASE_URL = 'https://campus-backend-arfy.onrender.com';
const PRIMARY = '#2F54EB';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const QUICK_QUESTIONS: { icon: IconName; text: string }[] = [
  { icon: 'storefront-outline', text: "What's available on the marketplace?" },
  { icon: 'calendar-outline', text: 'Any events happening this week?' },
  { icon: 'help-circle-outline', text: 'Help me with a DSA doubt' },
  { icon: 'briefcase-outline', text: 'How to get a good internship?' },
  { icon: 'restaurant-outline', text: 'Best food places near campus?' },
  { icon: 'book-outline', text: 'Study tips for exams?' },
];

type Msg = { role: 'user' | 'ai'; text: string };

export default function CampusChatScreen() {
  const Colors = useColors();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ text: string; reason: string } | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = async (text?: string, isRetry = false) => {
    const finalMsg = (text ?? message).trim();
    if (!finalMsg || loading) return;
    setError(null);
    setMessage('');
    // On a retry the user's message is already the last one in the list
    const base = isRetry ? messages.slice(0, -1) : messages;
    if (!isRetry) setMessages((prev) => [...prev, { role: 'user', text: finalMsg }]);
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/recommendations/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: finalMsg, history: base.slice(-6) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Could not get a reply');
      setMessages((prev) => [...prev, { role: 'ai', text: data.reply }]);
    } catch (err: any) {
      setError({ text: finalMsg, reason: err?.message || 'Could not get a reply' });
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Home');
  };

  const canSend = !!message.trim() && !loading;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={goBack} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.botAvatar}>
            <Ionicons name="sparkles" size={18} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>CampusBot</Text>
            <Text style={styles.headerSub}>AI assistant for your campus</Text>
          </View>
          {messages.length > 0 && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => { setMessages([]); setError(null); }}
              accessibilityRole="button"
              accessibilityLabel="Clear chat"
            >
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {messages.length === 0 ? (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.introCard}>
              <View style={styles.introIcon}>
                <Ionicons name="sparkles" size={30} color="#FFFFFF" />
              </View>
              <Text style={styles.introTitle}>Hi, I am CampusBot</Text>
              <Text style={styles.introText}>
                Ask me about the marketplace, events, study help, career advice and life on your campus.
              </Text>
            </View>

            <Text style={styles.sectionLabel}>QUICK QUESTIONS</Text>
            {QUICK_QUESTIONS.map((q) => (
              <TouchableOpacity
                key={q.text}
                style={styles.quickRow}
                onPress={() => sendMessage(q.text)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={q.text}
              >
                <Ionicons name={q.icon} size={20} color={Colors.accent} />
                <Text style={styles.quickText}>{q.text}</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg, i) => (
              <View key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
                {msg.role === 'ai' && (
                  <View style={styles.aiTag}>
                    <Ionicons name="sparkles" size={12} color={Colors.accent} />
                    <Text style={styles.aiTagText}>CampusBot</Text>
                  </View>
                )}
                <View style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAi]}>
                  <Text style={[styles.bubbleText, msg.role === 'user' && { color: '#FFFFFF' }]}>{msg.text}</Text>
                </View>
              </View>
            ))}

            {loading && (
              <View style={styles.thinking}>
                <ActivityIndicator color={Colors.accent} size="small" />
                <Text style={styles.thinkingText}>CampusBot is thinking...</Text>
              </View>
            )}

            {error && !loading && (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle" size={20} color={Colors.warn} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.errorTitle}>Could not get a reply</Text>
                  <Text style={styles.errorSub}>{error.reason}</Text>
                </View>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => sendMessage(error.text, true)}
                  accessibilityRole="button"
                  accessibilityLabel="Retry"
                >
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}

        <View style={styles.inputBar}>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Ask CampusBot anything"
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={500}
            style={styles.input}
          />
          <TouchableOpacity
            onPress={() => sendMessage()}
            disabled={!canSend}
            style={[styles.sendBtn, !canSend && { opacity: 0.4 }]}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            <Ionicons name="arrow-up" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const makeStyles = (Colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, gap: 10 },
    iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
    botAvatar: { width: 40, height: 40, borderRadius: 13, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: Colors.text, fontSize: 17, fontWeight: '800' },
    headerSub: { color: Colors.textMuted, fontSize: 12 },
    clearBtn: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
    clearText: { color: Colors.accent, fontSize: 13, fontWeight: '700' },

    introCard: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, padding: 20, marginBottom: 20, alignItems: 'center' },
    introIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    introTitle: { color: Colors.text, fontSize: 18, fontWeight: '800', marginBottom: 6 },
    introText: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
    sectionLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 10, letterSpacing: 0.8 },
    quickRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, paddingHorizontal: 14, marginBottom: 8 },
    quickText: { flex: 1, color: Colors.text, fontSize: 14.5 },

    aiTag: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
    aiTagText: { color: Colors.accent, fontSize: 12, fontWeight: '700' },
    bubble: { borderRadius: 16, padding: 14 },
    bubbleUser: { backgroundColor: PRIMARY, borderBottomRightRadius: 4 },
    bubbleAi: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: 4 },
    bubbleText: { color: Colors.text, fontSize: 14.5, lineHeight: 22 },
    thinking: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 16 },
    thinkingText: { color: Colors.textMuted, fontSize: 13.5 },
    errorCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.warn + '1F', borderWidth: 1, borderColor: Colors.warn + '55', borderRadius: 14, padding: 12 },
    errorTitle: { color: Colors.text, fontSize: 13.5, fontWeight: '700' },
    errorSub: { color: Colors.textMuted, fontSize: 12.5, marginTop: 1 },
    retryBtn: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14 },
    retryText: { color: Colors.accent, fontSize: 13.5, fontWeight: '800' },

    inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border },
    input: { flex: 1, minHeight: 44, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, color: Colors.text, fontSize: 14.5, maxHeight: 110 },
    sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center' },
  });