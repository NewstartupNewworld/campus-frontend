import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, StatusBar, SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '../../theme/ThemeProvider';

const BASE_URL = 'https://campus-backend-production-2dbb.up.railway.app';
const EXAM_TYPES = ['Mid-sem', 'End-sem', 'GATE', 'Placement'];
const SUBJECTS = ['DSA', 'OS', 'DBMS', 'CN', 'Algorithms', 'Maths', 'Other'];

export default function PYQScreen({ navigation }: any) {
  const colors = useColors();
  const [questions, setQuestions] = useState(['', '', '']);
  const [subject, setSubject] = useState('DSA');
  const [examType, setExamType] = useState('End-sem');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const addQuestion = () => setQuestions(prev => [...prev, '']);
  const removeQuestion = (i: number) => setQuestions(prev => prev.filter((_, idx) => idx !== i));
  const updateQuestion = (i: number, text: string) => setQuestions(prev => prev.map((q, idx) => idx === i ? text : q));

  const analyzeQuestions = async () => {
    const validQs = questions.filter(q => q.trim());
    if (validQs.length < 2) return Alert.alert('Add more questions', 'Please add at least 2 previous year questions');
    try {
      setLoading(true);
      setAnalysis(null);
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/ai/pyq`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ questions: validQs, subject, examType: examType.toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAnalysis(data.analysis);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to analyze questions');
    } finally {
      setLoading(false);
    }
  };

  const likelihoodColor = (l: string) =>
    l === 'very likely' ? '#EF4444' : l === 'likely' ? '#F97316' : '#22C55E';

  const importanceColor = (i: string) =>
    i === 'high' ? '#EF4444' : i === 'medium' ? '#F97316' : '#22C55E';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, gap: 12 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}
          style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.text, fontSize: 18 }}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>📊 PYQ Analyzer</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>Find patterns in previous year questions</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>

        {/* Subject chips */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>SUBJECT</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {SUBJECTS.map(s => (
              <TouchableOpacity key={s} onPress={() => setSubject(s)}
                style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: subject === s ? '#7C5CFF' : colors.card, borderWidth: 0.5, borderColor: subject === s ? '#7C5CFF' : colors.border }}>
                <Text style={{ color: subject === s ? '#fff' : colors.textMuted, fontSize: 13, fontWeight: '500' }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Exam type chips */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>EXAM TYPE</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          {EXAM_TYPES.map(t => (
            <TouchableOpacity key={t} onPress={() => setExamType(t)}
              style={{ flex: 1, paddingVertical: 8, borderRadius: 12, backgroundColor: examType === t ? '#7C5CFF' : colors.card, borderWidth: 0.5, borderColor: examType === t ? '#7C5CFF' : colors.border, alignItems: 'center' }}>
              <Text style={{ color: examType === t ? '#fff' : colors.textMuted, fontSize: 12, fontWeight: '500' }}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Questions input */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>
          PASTE PREVIOUS YEAR QUESTIONS
        </Text>
        <View style={{ gap: 10, marginBottom: 12 }}>
          {questions.map((q, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
              <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: '#7C5CFF22', alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
                <Text style={{ color: '#7C5CFF', fontSize: 11, fontWeight: '700' }}>{i + 1}</Text>
              </View>
              <TextInput
                value={q} onChangeText={t => updateQuestion(i, t)}
                placeholder={`Question ${i + 1}...`}
                placeholderTextColor={colors.textDim}
                multiline
                style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 12, color: colors.text, fontSize: 13, minHeight: 60 }}
              />
              {questions.length > 2 && (
                <TouchableOpacity onPress={() => removeQuestion(i)}
                  style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: '#EF444422', alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
                  <Text style={{ color: '#EF4444', fontSize: 14 }}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        <TouchableOpacity onPress={addQuestion}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#7C5CFF', borderStyle: 'dashed', marginBottom: 20 }}>
          <Text style={{ color: '#7C5CFF', fontSize: 18 }}>+</Text>
          <Text style={{ color: '#7C5CFF', fontSize: 14, fontWeight: '500' }}>Add another question</Text>
        </TouchableOpacity>

        {/* Analyze button */}
        <TouchableOpacity onPress={analyzeQuestions} disabled={loading}
          style={{ backgroundColor: loading ? colors.cardAlt : '#7C5CFF', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 24 }}>
          {loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Analyzing patterns...</Text>
            </View>
          ) : (
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>🔍 Analyze Patterns</Text>
          )}
        </TouchableOpacity>

        {/* Analysis output */}
        {analysis && !analysis.raw && (
          <View style={{ gap: 16 }}>
            <View style={{ backgroundColor: '#7C5CFF15', borderRadius: 16, padding: 16, borderLeftWidth: 3, borderLeftColor: '#7C5CFF' }}>
              <Text style={{ color: '#7C5CFF', fontSize: 13, fontWeight: '700', marginBottom: 4 }}>📊 Analysis Summary</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 20 }}>{analysis.summary}</Text>
            </View>

            {analysis.topTopics?.length > 0 && (
              <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16 }}>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 12 }}>🔥 Top Topics by Frequency</Text>
                {analysis.topTopics.map((t: any, i: number) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: i < analysis.topTopics.length - 1 ? 0.5 : 0, borderBottomColor: colors.border }}>
                    <Text style={{ color: colors.text, fontSize: 14 }}>{t.topic}</Text>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      <Text style={{ color: colors.textDim, fontSize: 12 }}>{t.frequency}x</Text>
                      <View style={{ backgroundColor: `${importanceColor(t.importance)}22`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                        <Text style={{ color: importanceColor(t.importance), fontSize: 11, fontWeight: '600' }}>{t.importance}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {analysis.predictions?.length > 0 && (
              <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16 }}>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 12 }}>🎯 Likely to Come</Text>
                {analysis.predictions.map((p: any, i: number) => (
                  <View key={i} style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>{p.topic}</Text>
                      <View style={{ backgroundColor: `${likelihoodColor(p.likelihood)}22`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                        <Text style={{ color: likelihoodColor(p.likelihood), fontSize: 11, fontWeight: '600' }}>{p.likelihood}</Text>
                      </View>
                    </View>
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>{p.reason}</Text>
                  </View>
                ))}
              </View>
            )}

            {analysis.prepTips?.length > 0 && (
              <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16 }}>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 10 }}>💡 Prep Tips</Text>
                {analysis.prepTips.map((t: string, i: number) => (
                  <Text key={i} style={{ color: colors.textMuted, fontSize: 13, lineHeight: 22 }}>• {t}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {analysis?.raw && (
          <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16 }}>
            <Text style={{ color: colors.textMuted, fontSize: 14, lineHeight: 22 }}>{analysis.raw}</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}