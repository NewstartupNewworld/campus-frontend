import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, StatusBar, SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '../../theme/ThemeProvider';

const BASE_URL = 'https://campus-backend-production-2dbb.up.railway.app';
const COMMON_SUBJECTS = ['Maths', 'Physics', 'DSA', 'OS', 'DBMS', 'CN', 'Algorithms', 'Chemistry'];

export default function StudyPlannerScreen({ navigation }: any) {
  const colors = useColors();
  const [subjects, setSubjects] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState('');
  const [examDate, setExamDate] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState('6');
  const [weakTopics, setWeakTopics] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [daysLeft, setDaysLeft] = useState(0);

  const toggleSubject = (s: string) => {
    setSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const addCustomSubject = () => {
    if (customSubject.trim() && !subjects.includes(customSubject.trim())) {
      setSubjects(prev => [...prev, customSubject.trim()]);
      setCustomSubject('');
    }
  };

  const generatePlan = async () => {
    if (!subjects.length) return Alert.alert('Add subjects', 'Please select at least one subject');
    if (!examDate) return Alert.alert('Set exam date', 'Please enter your exam date (YYYY-MM-DD)');
    try {
      setLoading(true);
      setPlan(null);
      const token = await AsyncStorage.getItem('token');
      const weakArr = weakTopics.split(',').map(t => t.trim()).filter(Boolean);
      const res = await fetch(`${BASE_URL}/api/ai/study-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          subjects, examDate,
          hoursPerDay: parseInt(hoursPerDay) || 6,
          weakTopics: weakArr,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPlan(data.plan);
      setDaysLeft(data.daysLeft);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to generate plan');
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
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>📅 Study Planner</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>

        {/* Subjects */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>
          SELECT SUBJECTS
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {COMMON_SUBJECTS.map(s => (
            <TouchableOpacity key={s} onPress={() => toggleSubject(s)}
              style={{
                paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                backgroundColor: subjects.includes(s) ? '#F97316' : colors.card,
                borderWidth: 0.5, borderColor: subjects.includes(s) ? '#F97316' : colors.border,
              }}>
              <Text style={{ color: subjects.includes(s) ? '#fff' : colors.textMuted, fontSize: 13, fontWeight: '500' }}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom subject */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          <TextInput
            value={customSubject} onChangeText={setCustomSubject}
            placeholder="Add custom subject..."
            placeholderTextColor={colors.textDim}
            onSubmitEditing={addCustomSubject}
            style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14 }}
          />
          <TouchableOpacity onPress={addCustomSubject}
            style={{ backgroundColor: '#F97316', borderRadius: 12, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 20 }}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Selected subjects display */}
        {subjects.length > 0 && (
          <View style={{ backgroundColor: '#F9731615', borderRadius: 12, padding: 12, marginBottom: 20 }}>
            <Text style={{ color: '#F97316', fontSize: 12, fontWeight: '600', marginBottom: 6 }}>
              Selected ({subjects.length}):
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>{subjects.join(' · ')}</Text>
          </View>
        )}

        {/* Exam date */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>
          EXAM DATE
        </Text>
        <TextInput
          value={examDate} onChangeText={setExamDate}
          placeholder="YYYY-MM-DD  e.g. 2026-07-20"
          placeholderTextColor={colors.textDim}
          style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14, marginBottom: 20 }}
        />

        {/* Hours per day */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>
          STUDY HOURS PER DAY
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          {['3', '4', '5', '6', '8', '10'].map(h => (
            <TouchableOpacity key={h} onPress={() => setHoursPerDay(h)}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 12,
                backgroundColor: hoursPerDay === h ? '#F97316' : colors.card,
                borderWidth: 0.5, borderColor: hoursPerDay === h ? '#F97316' : colors.border,
                alignItems: 'center',
              }}>
              <Text style={{ color: hoursPerDay === h ? '#fff' : colors.textMuted, fontSize: 14, fontWeight: '600' }}>{h}h</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Weak topics */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>
          WEAK TOPICS (optional)
        </Text>
        <TextInput
          value={weakTopics} onChangeText={setWeakTopics}
          placeholder="e.g. Calculus, Graph Algorithms, Deadlocks"
          placeholderTextColor={colors.textDim}
          style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14, marginBottom: 24 }}
        />

        {/* Generate button */}
        <TouchableOpacity onPress={generatePlan} disabled={loading}
          style={{ backgroundColor: loading ? colors.cardAlt : '#F97316', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 24 }}>
          {loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Creating your plan...</Text>
            </View>
          ) : (
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>📅 Generate Study Plan</Text>
          )}
        </TouchableOpacity>

        {/* Plan output */}
        {plan && !plan.raw && (
          <View style={{ gap: 16 }}>
            <View style={{ backgroundColor: '#F9731615', borderRadius: 16, padding: 16, borderLeftWidth: 3, borderLeftColor: '#F97316' }}>
              <Text style={{ color: '#F97316', fontSize: 13, fontWeight: '700', marginBottom: 4 }}>
                📊 {daysLeft} days left · {plan.hoursPerDay}h/day
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 20 }}>{plan.summary}</Text>
            </View>

            {plan.weeklyGoals?.length > 0 && (
              <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16 }}>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 10 }}>🎯 Weekly Goals</Text>
                {plan.weeklyGoals.map((g: string, i: number) => (
                  <Text key={i} style={{ color: colors.textMuted, fontSize: 13, lineHeight: 22 }}>• {g}</Text>
                ))}
              </View>
            )}

            <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}>📆 Day-by-Day Plan</Text>
            {plan.plan?.slice(0, 14).map((day: any) => (
              <View key={day.day} style={{ backgroundColor: colors.card, borderRadius: 14, padding: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>Day {day.day} — {day.focus}</Text>
                  <Text style={{ color: '#F97316', fontSize: 12, fontWeight: '600' }}>{day.hours}h</Text>
                </View>
                <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 4 }}>{day.topics?.join(', ')}</Text>
                {day.tip && <Text style={{ color: colors.textDim, fontSize: 12, fontStyle: 'italic' }}>💡 {day.tip}</Text>}
              </View>
            ))}

            {plan.importantTips?.length > 0 && (
              <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16 }}>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 10 }}>💡 Important Tips</Text>
                {plan.importantTips.map((t: string, i: number) => (
                  <Text key={i} style={{ color: colors.textMuted, fontSize: 13, lineHeight: 22 }}>• {t}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {plan?.raw && (
          <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16 }}>
            <Text style={{ color: colors.textMuted, fontSize: 14, lineHeight: 22 }}>{plan.raw}</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}