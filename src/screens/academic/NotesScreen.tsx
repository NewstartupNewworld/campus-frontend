import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, StatusBar, SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '../../theme/ThemeProvider';

const BASE_URL = 'https://campus-backend-production-2dbb.up.railway.app';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const STYLES = ['Concise', 'Detailed', 'Exam-focused'];
const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'DSA', 'OS', 'DBMS', 'CN', 'Algorithms', 'Other'];

export default function NotesScreen({ navigation }: any) {
  const colors = useColors();
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('DSA');
  const [level, setLevel] = useState('Intermediate');
  const [style, setStyle] = useState('Exam-focused');
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');

  const generateNotes = async () => {
    if (!topic.trim()) return Alert.alert('Enter a topic', 'Please enter the topic you want notes for');
    try {
      setLoading(true);
      setNotes('');
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/ai/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          topic: topic.trim(),
          subject,
          level: level.toLowerCase(),
          style: style.toLowerCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNotes(data.notes);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to generate notes');
    } finally {
      setLoading(false);
    }
  };

  const ChipRow = ({ label, options, selected, onSelect, color }: any) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>
        {label}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {options.map((opt: string) => (
            <TouchableOpacity
              key={opt}
              onPress={() => onSelect(opt)}
              style={{
                paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
                backgroundColor: selected === opt ? (color ?? colors.accent) : colors.card,
                borderWidth: 0.5,
                borderColor: selected === opt ? (color ?? colors.accent) : colors.border,
              }}
            >
              <Text style={{ color: selected === opt ? '#fff' : colors.textMuted, fontSize: 13, fontWeight: '500' }}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, gap: 12 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: colors.text, fontSize: 18 }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>📝 Notes Generator</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>

        {/* Topic input */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>
          TOPIC
        </Text>
        <TextInput
          value={topic}
          onChangeText={setTopic}
          placeholder="e.g. Binary Trees, Fourier Series, TCP/IP..."
          placeholderTextColor={colors.textDim}
          style={{
            backgroundColor: colors.card, borderRadius: 14, padding: 14,
            color: colors.text, fontSize: 15, marginBottom: 20,
          }}
        />

        <ChipRow label="Subject" options={SUBJECTS} selected={subject} onSelect={setSubject} color="#4F7CFF" />
        <ChipRow label="Level" options={LEVELS} selected={level} onSelect={setLevel} color="#22C55E" />
        <ChipRow label="Style" options={STYLES} selected={style} onSelect={setStyle} color="#F97316" />

        {/* Generate button */}
        <TouchableOpacity
          onPress={generateNotes}
          disabled={loading}
          style={{
            backgroundColor: loading ? colors.cardAlt : '#4F7CFF',
            borderRadius: 16, padding: 16,
            alignItems: 'center', marginTop: 8, marginBottom: 24,
          }}
        >
          {loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Generating notes...</Text>
            </View>
          ) : (
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>✨ Generate Notes</Text>
          )}
        </TouchableOpacity>

        {/* Notes output */}
        {notes ? (
          <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}>📄 {topic}</Text>
              <View style={{ backgroundColor: '#4F7CFF22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                <Text style={{ color: '#4F7CFF', fontSize: 11, fontWeight: '600' }}>{subject}</Text>
              </View>
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 14, lineHeight: 22 }}>{notes}</Text>
          </View>
        ) : null}

      </ScrollView>
    </SafeAreaView>
  );
}