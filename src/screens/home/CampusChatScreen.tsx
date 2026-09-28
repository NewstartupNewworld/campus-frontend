import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, StatusBar,
  SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useColors } from '../../theme/ThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';

const BASE_URL = 'https://campus-backend-arfy.onrender.com';

const QUICK_QUESTIONS = [
  '🛍️ What\'s available on marketplace?',
  '📅 Any events happening this week?',
  '🤔 Help me with DSA doubt',
  '💼 How to get a good internship?',
  '🍕 Best food places near campus?',
  '📚 Study tips for exams?',
];

type Message = { role: 'user' | 'ai'; text: string };

export default function CampusChatScreen() {
  const colors = useColors();
  const navigation = useNavigation<any>();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = async (text?: string) => {
    const finalMsg = (text || message).trim();
    if (!finalMsg || loading) return;
    setMessage('');
    setMessages(prev => [...prev, { role: 'user', text: finalMsg }]);
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/recommendations/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message: finalMsg,
          history: messages.slice(-6),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to get response');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, gap: 12 }}>
          <TouchableOpacity onPress={() => navigation.goBack()}
            style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.text, fontSize: 18 }}>‹</Text>
          </TouchableOpacity>
          <LinearGradient colors={['#4F7CFF', '#7C5CFF']}
            style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 18 }}>🤖</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>CampusBot</Text>
            <Text style={{ color: colors.textMuted, fontSize: 11 }}>AI assistant for your campus</Text>
          </View>
          {/* Clear chat */}
          {messages.length > 0 && (
            <TouchableOpacity onPress={() => setMessages([])}
              style={{ backgroundColor: colors.card, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}>
              <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600' }}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Messages or empty state */}
        {messages.length === 0 ? (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>

            {/* Bot intro card */}
            <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 20, marginBottom: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3 }}>
              <LinearGradient colors={['#4F7CFF', '#7C5CFF']}
                style={{ width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 30 }}>🤖</Text>
              </LinearGradient>
              <Text style={{ color: colors.text, fontSize: 17, fontWeight: '700', marginBottom: 6 }}>Hey! I'm CampusBot 👋</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                I know everything about your campus — marketplace, events, academic help, career advice and more. Ask me anything!
              </Text>
            </View>

            {/* Quick questions */}
            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              QUICK QUESTIONS
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {QUICK_QUESTIONS.map((q, i) => (
                <TouchableOpacity key={i} onPress={() => sendMessage(q)} activeOpacity={0.8}
                  style={{ backgroundColor: colors.card, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }}>
                  <Text style={{ color: colors.text, fontSize: 13 }}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        ) : (
          <ScrollView ref={scrollRef} style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}>
            {messages.map((msg, i) => (
              <View key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
                {msg.role === 'ai' && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <LinearGradient colors={['#4F7CFF', '#7C5CFF']}
                      style={{ width: 20, height: 20, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 11 }}>🤖</Text>
                    </LinearGradient>
                    <Text style={{ color: '#4F7CFF', fontSize: 11, fontWeight: '600' }}>CampusBot</Text>
                  </View>
                )}
                <View style={{
                  backgroundColor: msg.role === 'user' ? '#4F7CFF' : colors.card,
                  borderRadius: 16,
                  borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
                  borderBottomLeftRadius: msg.role === 'ai' ? 4 : 16,
                  padding: 14,
                  shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
                }}>
                  <Text style={{ color: msg.role === 'user' ? '#fff' : colors.text, fontSize: 14, lineHeight: 22 }}>
                    {msg.text}
                  </Text>
                </View>
              </View>
            ))}

            {loading && (
              <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: colors.card, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}>
                <ActivityIndicator color="#4F7CFF" size="small" />
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>CampusBot is thinking...</Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* Input bar */}
        <View style={{
          flexDirection: 'row', alignItems: 'flex-end', gap: 10,
          padding: 16, paddingBottom: 24,
          backgroundColor: colors.card,
          shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
        }}>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Ask CampusBot anything..."
            placeholderTextColor={colors.textDim}
            multiline maxLength={500}
            style={{
              flex: 1, backgroundColor: colors.bg, borderRadius: 14,
              padding: 12, color: colors.text, fontSize: 14, maxHeight: 100,
            }}
          />
          <TouchableOpacity
            onPress={() => sendMessage()}
            disabled={loading || !message.trim()}
            style={{
              width: 44, height: 44, borderRadius: 14, overflow: 'hidden',
              opacity: message.trim() && !loading ? 1 : 0.4,
            }}
          >
            <LinearGradient colors={['#4F7CFF', '#7C5CFF']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 20, color: '#fff' }}>↑</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}