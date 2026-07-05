import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, StatusBar, SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useColors } from '../../theme/ThemeProvider';

const BASE_URL = 'https://campus-backend-production-2dbb.up.railway.app';

const SKILLS = ['Web Dev', 'App Dev', 'UI/UX', 'Content Writing', 'Video Editing', 'Data Entry', 'ML/AI', 'Graphic Design', 'Social Media', 'Tutoring'];
const HOURLY_RATES = ['₹200-500/hr', '₹500-1000/hr', '₹1000-2000/hr', '₹2000+/hr'];

const GIG_PLATFORMS = [
  { name: 'Fiverr', desc: 'Best for beginners, global clients', icon: '🟢', color: '#1DBF73' },
  { name: 'Upwork', desc: 'Higher paying, long term projects', icon: '🟦', color: '#14A800' },
  { name: 'Freelancer.in', desc: 'Best for Indian market', icon: '🇮🇳', color: '#0E1724' },
  { name: 'Toptal', desc: 'Top 3% freelancers, premium pay', icon: '⭐', color: '#F97316' },
  { name: 'PeoplePerHour', desc: 'Good for UK/EU clients', icon: '🌍', color: '#4F7CFF' },
];

export default function GigsScreen() {
  const colors = useColors();
  const navigation = useNavigation<any>();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedRate, setSelectedRate] = useState('₹500-1000/hr');
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<string>('');

  const toggleSkill = (s: string) =>
    setSelectedSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const getGigAdvice = async () => {
    if (!selectedSkills.length) {
      Alert.alert('Select skills', 'Please select at least one skill'); return;
    }
    try {
      setLoading(true);
      setAdvice('');
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/ai/doubt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          subject: 'Career',
          question: `I am a college student who wants to start freelancing.
My skills: ${selectedSkills.join(', ')}.
Target hourly rate: ${selectedRate}.

Give me:
1. Best gig ideas for my skills (3-4 specific ideas with earning potential)
2. How to create a winning profile on Fiverr/Upwork
3. My first gig proposal template (short)
4. Common mistakes to avoid
5. Realistic income expectation in first 3 months

Be specific and practical. Talk like a senior who has done freelancing.`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAdvice(data.answer);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to get advice');
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
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>⚡ Freelance Gigs</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>Earn while you study</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>

        {/* Earning banner */}
        <View style={{ backgroundColor: '#F9731615', borderRadius: 14, padding: 14, marginBottom: 20, borderLeftWidth: 3, borderLeftColor: '#F97316' }}>
          <Text style={{ color: '#F97316', fontSize: 13, fontWeight: '700', marginBottom: 4 }}>💰 Student Earning Potential</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, lineHeight: 19 }}>
            Students with 1-2 skills earn ₹10,000–₹50,000/month freelancing part-time. Start with small gigs, build reviews, scale up.
          </Text>
        </View>

        {/* Skills */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>YOUR SKILLS</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {SKILLS.map(s => (
            <TouchableOpacity key={s} onPress={() => toggleSkill(s)}
              style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: selectedSkills.includes(s) ? '#F97316' : colors.card, borderWidth: 0.5, borderColor: selectedSkills.includes(s) ? '#F97316' : colors.border }}>
              <Text style={{ color: selectedSkills.includes(s) ? '#fff' : colors.textMuted, fontSize: 13, fontWeight: '500' }}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Target rate */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>TARGET RATE</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {HOURLY_RATES.map(r => (
            <TouchableOpacity key={r} onPress={() => setSelectedRate(r)}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: selectedRate === r ? '#F97316' : colors.card, borderWidth: 0.5, borderColor: selectedRate === r ? '#F97316' : colors.border }}>
              <Text style={{ color: selectedRate === r ? '#fff' : colors.textMuted, fontSize: 13, fontWeight: '500' }}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Get advice button */}
        <TouchableOpacity onPress={getGigAdvice} disabled={loading}
          style={{ backgroundColor: loading ? colors.cardAlt : '#F97316', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 24 }}>
          {loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Getting gig ideas...</Text>
            </View>
          ) : (
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>⚡ Get Gig Ideas & Strategy</Text>
          )}
        </TouchableOpacity>

        {/* AI Advice output */}
        {advice ? (
          <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#F9731622', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 16 }}>🤖</Text>
              </View>
              <Text style={{ color: '#F97316', fontSize: 13, fontWeight: '700' }}>AI Freelance Mentor</Text>
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 14, lineHeight: 22 }}>{advice}</Text>
          </View>
        ) : null}

        {/* Platforms */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.6 }}>TOP PLATFORMS</Text>
        {GIG_PLATFORMS.map((p, i) => (
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

      </ScrollView>
    </SafeAreaView>
  );
}