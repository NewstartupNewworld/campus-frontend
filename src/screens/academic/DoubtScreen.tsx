import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, StatusBar,
  KeyboardAvoidingView, Platform, SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '../../theme/ThemeProvider';

const BASE_URL = 'https://campus-backend-production-2dbb.up.railway.app';
const SUBJECTS = ['Maths', 'Physics', 'Chemistry', 'DSA', 'OS', 'DBMS', 'CN', 'Algorithms', 'Other'];

type Message = { role: 'user' | 'ai'; text: string };

export default function DoubtScreen({ navigation }: any) {
  const colors = useColors();
  const [question, setQuestion] = useState('');
  const [subject, setSubject] = useState('DSA');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  const solveDoubt = async () => {
    if (!question.trim()) return;
    const q = question.trim();
    setQuestion('');
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const context = messages.slice(-4).map(m => `${m.role}: ${m.text}`).join('\n');
      const res = await fetch(`${BASE_URL}/api/ai/doubt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question: q, subject, context }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages(prev => [...prev, { role: 'ai', text: data.answer }]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to solve doubt');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, gap: 12 }}>
          <TouchableOpacity onPress={() => navigation.goBack()}
            style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.text, fontSize: 18 }}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>🤔 Doubt Solver</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>Ask anything, get clear explanations</Text>
          </View>
        </View>

        {/* Subject chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 12 }}>
          {SUBJECTS.map(s => (
            <TouchableOpacity key={s} onPress={() => setSubject(s)}
              style={{
                paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
                backgroundColor: subject === s ? '#22C55E' : colors.card,
                borderWidth: 0.5, borderColor: subject === s ? '#22C55E' : colors.border,
              }}>
              <Text style={{ color: subject === s ? '#fff' : colors.textMuted, fontSize: 13, fontWeight: '500' }}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Chat messages */}
        <ScrollView ref={scrollRef} style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}>

          {messages.length === 0 && (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>🤔</Text>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Ask your doubt</Text>
              <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
                Ask any academic question and get a clear step-by-step explanation
              </Text>
              <View style={{ marginTop: 24, gap: 8, width: '100%' }}>
                {[
                  'Why is quicksort O(n²) in worst case?',
                  'Explain deadlock with an example',
                  'What is the difference between TCP and UDP?',
                ].map((q, i) => (
                  <TouchableOpacity key={i} onPress={() => setQuestion(q)}
                    style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, borderWidth: 0.5, borderColor: colors.border }}>
                    <Text style={{ color: colors.textMuted, fontSize: 13 }}>💬 {q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {messages.map((msg, i) => (
            <View key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
              {msg.role === 'ai' && (
                <Text style={{ color: '#22C55E', fontSize: 11, fontWeight: '600', marginBottom: 4 }}>AI Tutor</Text>
              )}
              <View style={{
                backgroundColor: msg.role === 'user' ? '#4F7CFF' : colors.card,
                borderRadius: 16,
                borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
                borderBottomLeftRadius: msg.role === 'ai' ? 4 : 16,
                padding: 14,
                borderWidth: msg.role === 'ai' ? 0.5 : 0,
                borderColor: colors.border,
              }}>
                <Text style={{ color: msg.role === 'user' ? '#fff' : colors.textMuted, fontSize: 14, lineHeight: 22 }}>
                  {msg.text}
                </Text>
              </View>
            </View>
          ))}

          {loading && (
            <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 }}>
              <ActivityIndicator color="#22C55E" size="small" />
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>Thinking...</Text>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={{
          flexDirection: 'row', alignItems: 'flex-end', gap: 10,
          padding: 16, paddingBottom: 24,
          backgroundColor: colors.card,
        }}>
          <TextInput
            value={question}
            onChangeText={setQuestion}
            placeholder="Type your doubt here..."
            placeholderTextColor={colors.textDim}
            multiline maxLength={500}
            style={{
              flex: 1, backgroundColor: colors.bg, borderRadius: 14,
              padding: 12, color: colors.text, fontSize: 14, maxHeight: 100,
            }}
          />
          <TouchableOpacity
            onPress={solveDoubt}
            disabled={loading || !question.trim()}
            style={{
              width: 44, height: 44, borderRadius: 14,
              backgroundColor: question.trim() ? '#22C55E' : colors.cardAlt,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 20 }}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}