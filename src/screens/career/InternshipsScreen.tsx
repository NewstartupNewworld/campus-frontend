import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, StatusBar, SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useColors } from '../../theme/ThemeProvider';

const BASE_URL = 'https://campus-backend-production-2dbb.up.railway.app';

const SKILLS = ['React', 'Node.js', 'Python', 'ML/AI', 'DSA', 'Java', 'Flutter', 'DevOps', 'UI/UX', 'Data Analysis'];
const DOMAINS = ['Web Dev', 'App Dev', 'Data Science', 'ML/AI', 'DevOps', 'Product', 'Design', 'Research'];
const DURATIONS = ['1 month', '2 months', '3 months', '6 months'];

export default function InternshipsScreen() {
  const colors = useColors();
  const navigation = useNavigation<any>();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedDomain, setSelectedDomain] = useState('Web Dev');
  const [duration, setDuration] = useState('2 months');
  const [cgpa, setCgpa] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any>(null);

  const toggleSkill = (s: string) =>
    setSelectedSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const getRecommendations = async () => {
    if (!selectedSkills.length) {
      Alert.alert('Select skills', 'Please select at least one skill'); return;
    }
    try {
      setLoading(true);
      setRecommendations(null);
      const token = await AsyncStorage.getItem('token');
      const user = await AsyncStorage.getItem('user');
      const userData = user ? JSON.parse(user) : {};

      const res = await fetch(`${BASE_URL}/api/ai/doubt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          subject: 'Career',
          question: `I am a ${userData.year || '3rd year'} ${userData.department || 'CS'} student from ${userData.college || 'IIT'} with CGPA ${cgpa || '7.5'}.
My skills: ${selectedSkills.join(', ')}.
Target domain: ${selectedDomain}.
Preferred duration: ${duration}.

Give me:
1. Top 5 companies I should apply to for internships (with why)
2. Top 3 platforms to find internships (Internshala, LinkedIn etc)
3. Skills I should add to my profile
4. What my resume should highlight
5. One specific tip for getting shortlisted

Format as a helpful mentor would explain.`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRecommendations(data.answer);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to get recommendations');
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
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>💼 Internships</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>AI-powered internship guidance</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>

        {/* Skills */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>YOUR SKILLS</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {SKILLS.map(s => (
            <TouchableOpacity key={s} onPress={() => toggleSkill(s)}
              style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: selectedSkills.includes(s) ? '#4F7CFF' : colors.card, borderWidth: 0.5, borderColor: selectedSkills.includes(s) ? '#4F7CFF' : colors.border }}>
              <Text style={{ color: selectedSkills.includes(s) ? '#fff' : colors.textMuted, fontSize: 13, fontWeight: '500' }}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Domain */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>TARGET DOMAIN</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {DOMAINS.map(d => (
              <TouchableOpacity key={d} onPress={() => setSelectedDomain(d)}
                style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: selectedDomain === d ? '#4F7CFF' : colors.card, borderWidth: 0.5, borderColor: selectedDomain === d ? '#4F7CFF' : colors.border }}>
                <Text style={{ color: selectedDomain === d ? '#fff' : colors.textMuted, fontSize: 13, fontWeight: '500' }}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Duration */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>DURATION</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          {DURATIONS.map(d => (
            <TouchableOpacity key={d} onPress={() => setDuration(d)}
              style={{ flex: 1, paddingVertical: 8, borderRadius: 12, backgroundColor: duration === d ? '#4F7CFF' : colors.card, borderWidth: 0.5, borderColor: duration === d ? '#4F7CFF' : colors.border, alignItems: 'center' }}>
              <Text style={{ color: duration === d ? '#fff' : colors.textMuted, fontSize: 12, fontWeight: '500' }}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* CGPA */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>CGPA (optional)</Text>
        <TextInput
          value={cgpa} onChangeText={setCgpa}
          placeholder="e.g. 8.2"
          placeholderTextColor={colors.textDim}
          keyboardType="decimal-pad"
          style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14, marginBottom: 24 }}
        />

        {/* Get recommendations button */}
        <TouchableOpacity onPress={getRecommendations} disabled={loading}
          style={{ backgroundColor: loading ? colors.cardAlt : '#4F7CFF', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 24 }}>
          {loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Getting recommendations...</Text>
            </View>
          ) : (
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>🎯 Get Internship Guidance</Text>
          )}
        </TouchableOpacity>

        {/* Recommendations output */}
        {recommendations && (
          <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#4F7CFF22', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 16 }}>🤖</Text>
              </View>
              <Text style={{ color: '#4F7CFF', fontSize: 13, fontWeight: '700' }}>AI Career Mentor</Text>
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 14, lineHeight: 22 }}>{recommendations}</Text>
          </View>
        )}

        {/* Quick links */}
        <View style={{ marginTop: 24 }}>
          <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.6 }}>POPULAR PLATFORMS</Text>
          {[
            { name: 'Internshala', desc: 'Best for Indian students', icon: '🏆', color: '#4F7CFF' },
            { name: 'LinkedIn', desc: 'Global opportunities', icon: '💼', color: '#0077B5' },
            { name: 'AngelList', desc: 'Startup internships', icon: '🚀', color: '#EF4444' },
            { name: 'LeetCode Jobs', desc: 'For DSA-strong students', icon: '💻', color: '#F97316' },
          ].map((p, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: p.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 20 }}>{p.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>{p.name}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>{p.desc}</Text>
              </View>
              <Text style={{ color: colors.textDim, fontSize: 16 }}>›</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}