import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '../../theme/ThemeProvider';

const BASE_URL = 'https://campus-backend-arfy.onrender.com';

const HABITS = [
  'Early bird', 'Night owl', 'Non-smoker', 'Smoker',
  'Non-drinker', 'Vegetarian', 'Gym goer', 'Introvert',
  'Extrovert', 'Clean freak', 'Pet friendly', 'Music lover',
];
const GENDERS = ['Male', 'Female', 'Any'];

export default function CreateRoommateScreen({ navigation }: any) {
  const colors = useColors();
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [gender, setGender] = useState('Any');
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [preferences, setPreferences] = useState('');
  const [lookingFrom, setLookingFrom] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleHabit = (h: string) => {
    setSelectedHabits(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h]);
  };

  const submit = async () => {
    if (!budgetMin || !budgetMax) return Alert.alert('Missing', 'Please enter your budget range');
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/roommate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          budgetMin: parseInt(budgetMin),
          budgetMax: parseInt(budgetMax),
          gender, habits: selectedHabits,
          preferences, lookingFrom, contact,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      Alert.alert('✅ Profile Posted!', 'Your roommate profile is now live!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to save');
    } finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, gap: 12 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}
          style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.text, fontSize: 18 }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>🏠 Roommate Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>

        {/* Budget */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>BUDGET RANGE (₹/month) *</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <TextInput value={budgetMin} onChangeText={setBudgetMin}
            placeholder="Min e.g. 3000" placeholderTextColor={colors.textDim}
            keyboardType="numeric"
            style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14, borderWidth: 0.5, borderColor: colors.border }}
          />
          <TextInput value={budgetMax} onChangeText={setBudgetMax}
            placeholder="Max e.g. 8000" placeholderTextColor={colors.textDim}
            keyboardType="numeric"
            style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14, borderWidth: 0.5, borderColor: colors.border }}
          />
        </View>

        {/* Gender preference */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>ROOMMATE GENDER PREFERENCE</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          {GENDERS.map(g => (
            <TouchableOpacity key={g} onPress={() => setGender(g)}
              style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: gender === g ? '#22C55E' : colors.card, borderWidth: 0.5, borderColor: gender === g ? '#22C55E' : colors.border }}>
              <Text style={{ color: gender === g ? '#fff' : colors.textMuted, fontSize: 14, fontWeight: '600' }}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Looking from */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>LOOKING FROM</Text>
        <TextInput value={lookingFrom} onChangeText={setLookingFrom}
          placeholder="e.g. July 2026, Next semester"
          placeholderTextColor={colors.textDim}
          style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14, borderWidth: 0.5, borderColor: colors.border, marginBottom: 20 }}
        />

        {/* Habits */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 }}>YOUR HABITS</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {HABITS.map(h => (
            <TouchableOpacity key={h} onPress={() => toggleHabit(h)}
              style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: selectedHabits.includes(h) ? '#22C55E' : colors.card, borderWidth: 0.5, borderColor: selectedHabits.includes(h) ? '#22C55E' : colors.border }}>
              <Text style={{ color: selectedHabits.includes(h) ? '#fff' : colors.textMuted, fontSize: 13 }}>{h}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Preferences */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>ABOUT YOU / PREFERENCES</Text>
        <TextInput value={preferences} onChangeText={setPreferences}
          placeholder="Tell potential roommates about yourself and what you're looking for..."
          placeholderTextColor={colors.textDim} multiline numberOfLines={4}
          style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14, borderWidth: 0.5, borderColor: colors.border, marginBottom: 20, minHeight: 100, textAlignVertical: 'top' }}
        />

        {/* Contact */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>CONTACT</Text>
        <TextInput value={contact} onChangeText={setContact}
          placeholder="Phone number or email"
          placeholderTextColor={colors.textDim} keyboardType="phone-pad"
          style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14, borderWidth: 0.5, borderColor: colors.border, marginBottom: 24 }}
        />

        <TouchableOpacity onPress={submit} disabled={loading}
          style={{ backgroundColor: loading ? colors.cardAlt : '#22C55E', borderRadius: 16, padding: 16, alignItems: 'center' }}>
          {loading ? <ActivityIndicator color="#fff" /> :
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>🏠 Post Profile</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}