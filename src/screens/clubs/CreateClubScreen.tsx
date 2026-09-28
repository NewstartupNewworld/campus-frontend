import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '../../theme/ThemeProvider';

const BASE_URL = 'https://campus-backend-arfy.onrender.com';
const CATEGORIES = ['Tech', 'Cultural', 'Sports', 'Music', 'Dance', 'Literary', 'Social', 'Science', 'Other'];
const ICONS = ['🎯', '💻', '🎭', '⚽', '🎵', '💃', '📚', '🔬', '🎨', '🤝', '🌱', '🎬', '🏆', '🎮', '✈️'];

export default function CreateClubScreen({ navigation }: any) {
  const colors = useColors();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Tech');
  const [icon, setIcon] = useState('🎯');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name.trim()) return Alert.alert('Missing', 'Club name is required');
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/clubs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, description, category, icon }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      Alert.alert('✅ Club Created!', `${name} is now live!`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to create club');
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
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>🎯 Create Club</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>

        {/* Icon picker */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 }}>CLUB ICON</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
          {ICONS.map(i => (
            <TouchableOpacity key={i} onPress={() => setIcon(i)}
              style={{ width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: icon === i ? '#7C5CFF22' : colors.card, borderWidth: icon === i ? 2 : 0.5, borderColor: icon === i ? '#7C5CFF' : colors.border }}>
              <Text style={{ fontSize: 24 }}>{i}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Name */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>CLUB NAME *</Text>
        <TextInput value={name} onChangeText={setName}
          placeholder="e.g. Coding Club, Dance Society, Photography Club"
          placeholderTextColor={colors.textDim}
          style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14, borderWidth: 0.5, borderColor: colors.border, marginBottom: 16 }}
        />

        {/* Category */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 }}>CATEGORY</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {CATEGORIES.map(c => (
            <TouchableOpacity key={c} onPress={() => setCategory(c)}
              style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: category === c ? '#7C5CFF' : colors.card, borderWidth: 0.5, borderColor: category === c ? '#7C5CFF' : colors.border }}>
              <Text style={{ color: category === c ? '#fff' : colors.textMuted, fontSize: 13 }}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Description */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>DESCRIPTION</Text>
        <TextInput value={description} onChangeText={setDescription}
          placeholder="What is your club about? What do you do?"
          placeholderTextColor={colors.textDim} multiline numberOfLines={4}
          style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14, borderWidth: 0.5, borderColor: colors.border, marginBottom: 24, minHeight: 100, textAlignVertical: 'top' }}
        />

        <TouchableOpacity onPress={submit} disabled={loading}
          style={{ backgroundColor: loading ? colors.cardAlt : '#7C5CFF', borderRadius: 16, padding: 16, alignItems: 'center' }}>
          {loading ? <ActivityIndicator color="#fff" /> :
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>{icon} Create Club</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}