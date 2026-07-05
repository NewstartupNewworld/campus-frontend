import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, StatusBar, SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useColors } from '../../theme/ThemeProvider';

const BASE_URL = 'https://campus-backend-production-2dbb.up.railway.app';
const ROLES = ['Software Engineer', 'Data Scientist', 'Product Manager', 'DevOps', 'ML Engineer', 'Frontend Dev', 'Backend Dev'];
const EXPERIENCE = ['Fresher', '1 year', '2 years', '3+ years'];

export default function ResumeAIScreen() {
  const colors = useColors();
  const navigation = useNavigation<any>();
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [experience, setExperience] = useState('Fresher');
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<any>(null);

  const gradeColor = (grade: string) => {
    if (grade === 'A+' || grade === 'A') return '#22C55E';
    if (grade === 'B+' || grade === 'B') return '#F97316';
    return '#EF4444';
  };

  const analyzeResume = async () => {
    if (!resumeText.trim()) {
      Alert.alert('Paste your resume', 'Please paste your resume text first'); return;
    }
    if (resumeText.trim().length < 100) {
      Alert.alert('Too short', 'Please paste more resume content for accurate analysis'); return;
    }
    try {
      setLoading(true);
      setReview(null);
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/ai/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ resumeText: resumeText.trim(), targetRole, experience: experience.toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReview(data.review);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to analyze resume');
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>📄 Resume AI</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>Get instant AI feedback on your resume</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>

        {/* Target role */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>TARGET ROLE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {ROLES.map(r => (
              <TouchableOpacity key={r} onPress={() => setTargetRole(r)}
                style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: targetRole === r ? '#22C55E' : colors.card, borderWidth: 0.5, borderColor: targetRole === r ? '#22C55E' : colors.border }}>
                <Text style={{ color: targetRole === r ? '#fff' : colors.textMuted, fontSize: 13, fontWeight: '500' }}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Experience */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>EXPERIENCE</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          {EXPERIENCE.map(e => (
            <TouchableOpacity key={e} onPress={() => setExperience(e)}
              style={{ flex: 1, paddingVertical: 8, borderRadius: 12, backgroundColor: experience === e ? '#22C55E' : colors.card, borderWidth: 0.5, borderColor: experience === e ? '#22C55E' : colors.border, alignItems: 'center' }}>
              <Text style={{ color: experience === e ? '#fff' : colors.textMuted, fontSize: 12, fontWeight: '500' }}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Resume input */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>PASTE YOUR RESUME</Text>
        <TextInput
          value={resumeText}
          onChangeText={setResumeText}
          placeholder="Paste your resume text here... (copy from Word/PDF)"
          placeholderTextColor={colors.textDim}
          multiline
          textAlignVertical="top"
          style={{ backgroundColor: colors.card, borderRadius: 14, padding: 14, color: colors.text, fontSize: 13, minHeight: 180, marginBottom: 6 }}
        />
        <Text style={{ color: colors.textDim, fontSize: 11, marginBottom: 20 }}>
          {resumeText.length} characters · Tip: More content = better analysis
        </Text>

        {/* Analyze button */}
        <TouchableOpacity onPress={analyzeResume} disabled={loading}
          style={{ backgroundColor: loading ? colors.cardAlt : '#22C55E', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 24 }}>
          {loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Analyzing resume...</Text>
            </View>
          ) : (
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>🔍 Analyze Resume</Text>
          )}
        </TouchableOpacity>

        {/* Review output */}
        {review && !review.raw && (
          <View style={{ gap: 14 }}>

            {/* Score card */}
            <View style={{ backgroundColor: colors.card, borderRadius: 18, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3 }}>
              <Text style={{ color: gradeColor(review.grade), fontSize: 52, fontWeight: '900' }}>{review.grade}</Text>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 4 }}>{review.overallScore}/100</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 19 }}>{review.summary}</Text>
            </View>

            {/* Strengths */}
            {review.strengths?.length > 0 && (
              <View style={{ backgroundColor: '#22C55E15', borderRadius: 16, padding: 16, borderLeftWidth: 3, borderLeftColor: '#22C55E' }}>
                <Text style={{ color: '#22C55E', fontSize: 14, fontWeight: '700', marginBottom: 8 }}>✅ Strengths</Text>
                {review.strengths.map((s: string, i: number) => (
                  <Text key={i} style={{ color: colors.textMuted, fontSize: 13, lineHeight: 22 }}>• {s}</Text>
                ))}
              </View>
            )}

            {/* Improvements */}
            {review.improvements?.length > 0 && (
              <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3 }}>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 12 }}>⚠️ Areas to Improve</Text>
                {review.improvements.map((item: any, i: number) => (
                  <View key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottomWidth: i < review.improvements.length - 1 ? 0.5 : 0, borderBottomColor: colors.border }}>
                    <Text style={{ color: '#F97316', fontSize: 12, fontWeight: '700', marginBottom: 3 }}>{item.section}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 4 }}>❌ {item.issue}</Text>
                    <Text style={{ color: '#22C55E', fontSize: 13 }}>✅ {item.fix}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Missing keywords */}
            {review.missingKeywords?.length > 0 && (
              <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3 }}>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 10 }}>🔑 Missing Keywords</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {review.missingKeywords.map((kw: string, i: number) => (
                    <View key={i} style={{ backgroundColor: '#EF444422', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                      <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '600' }}>{kw}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Action items */}
            {review.actionItems?.length > 0 && (
              <View style={{ backgroundColor: '#4F7CFF15', borderRadius: 16, padding: 16, borderLeftWidth: 3, borderLeftColor: '#4F7CFF' }}>
                <Text style={{ color: '#4F7CFF', fontSize: 14, fontWeight: '700', marginBottom: 8 }}>📋 Action Items</Text>
                {review.actionItems.map((a: string, i: number) => (
                  <Text key={i} style={{ color: colors.textMuted, fontSize: 13, lineHeight: 22 }}>{i + 1}. {a}</Text>
                ))}
              </View>
            )}

          </View>
        )}

        {review?.raw && (
          <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16 }}>
            <Text style={{ color: colors.textMuted, fontSize: 14, lineHeight: 22 }}>{review.raw}</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}