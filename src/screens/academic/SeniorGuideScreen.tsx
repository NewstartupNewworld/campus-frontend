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

const TOPICS = ['Placements', 'GATE', 'Higher Studies', 'Startups', 'Internships', 'College Life', 'Projects', 'Skills'];

const SAMPLE_QUESTIONS = [
  'How to prepare for placements in 3rd year?',
  'Which companies come to IIT/NIT campuses?',
  'Should I do MBA or MS after BTech?',
  'How to get a research internship abroad?',
  'What skills should I learn for a startup job?',
  'How to balance studies and coding practice?',
];

type Message = { role: 'user' | 'ai'; text: string };

export default function SeniorGuideScreen() {
  const colors = useColors();
  const navigation = useNavigation<any>();
  const [question, setQuestion] = useState('');
  const [topic, setTopic] = useState('Placements');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  const askSenior = async (q?: string) => {
    const finalQ = (q || question).trim();
    if (!finalQ) return;
    setQuestion('');
    setMessages(prev => [...prev, { role: 'user', text: finalQ }]);
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const user = await AsyncStorage.getItem('user');
      const userData = user ? JSON.parse(user) : {};
      const context = messages.slice(-4).map(m => `${m.role}: ${m.text}`).join('\n');

      const res = await fetch(`${BASE_URL}/api/ai/doubt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          subject: topic,
          context,
          question: `You are a helpful 4th year IIT/NIT senior student giving genuine advice to a junior.
The junior is a ${userData.year || '2nd year'} ${userData.department || 'CS'} student at ${userData.college || 'a top engineering college'}.
Topic: ${topic}
Question: ${finalQ}

Give advice like a real senior would — honest, practical, from personal experience. 
Include specific actionable steps. Don't be generic.
If it's about placements, mention real companies, timelines, what actually works.
Keep it conversational and warm, like talking to a friend.`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages(prev => [...prev, { role: 'ai', text: data.answer }]);
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
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>👨‍🎓 Senior Guide</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>Ask a senior — placements, life, career</Text>
          </View>
        </View>

        {/* Topic chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 10 }}>
          {TOPICS.map(t => (
            <TouchableOpacity key={t} onPress={() => setTopic(t)}
              style={{
                paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
                backgroundColor: topic === t ? '#EF4444' : colors.card,
                borderWidth: 0.5, borderColor: topic === t ? '#EF4444' : colors.border,
              }}>
              <Text style={{ color: topic === t ? '#fff' : colors.textMuted, fontSize: 13, fontWeight: '500' }}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Messages or empty state */}
        {messages.length === 0 ? (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
            {/* Senior avatar card */}
            <View style={{ backgroundColor: colors.card, borderRadius: 18, padding: 18, marginBottom: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3 }}>
              <LinearGradient colors={['#EF4444', '#C97BFF']} style={{ width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 30 }}>👨‍🎓</Text>
              </LinearGradient>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 4 }}>Your AI Senior</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 19 }}>
                Ask me anything — placements, internships, higher studies, campus life. I'll give you honest advice like a real senior would.
              </Text>
            </View>

            {/* Sample questions */}
            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              TRY ASKING
            </Text>
            {SAMPLE_QUESTIONS.map((q, i) => (
              <TouchableOpacity key={i} onPress={() => askSenior(q)} activeOpacity={0.8}
                style={{ backgroundColor: colors.card, borderRadius: 14, padding: 13, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }}>
                <Text style={{ color: colors.text, fontSize: 13, lineHeight: 19 }}>💬 {q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <ScrollView ref={scrollRef} style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}>
            {messages.map((msg, i) => (
              <View key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
                {msg.role === 'ai' && (
                  <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '600', marginBottom: 4 }}>👨‍🎓 Senior</Text>
                )}
                <View style={{
                  backgroundColor: msg.role === 'user' ? '#EF4444' : colors.card,
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
                <ActivityIndicator color="#EF4444" size="small" />
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>Senior is thinking...</Text>
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
            value={question}
            onChangeText={setQuestion}
            placeholder="Ask your senior anything..."
            placeholderTextColor={colors.textDim}
            multiline maxLength={500}
            style={{
              flex: 1, backgroundColor: colors.bg, borderRadius: 14,
              padding: 12, color: colors.text, fontSize: 14, maxHeight: 100,
            }}
          />
          <TouchableOpacity
            onPress={() => askSenior()}
            disabled={loading || !question.trim()}
            style={{
              width: 44, height: 44, borderRadius: 14,
              backgroundColor: question.trim() && !loading ? '#EF4444' : colors.cardAlt,
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
