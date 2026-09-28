import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '../../theme/ThemeProvider';

const BASE_URL = 'https://campus-backend-arfy.onrender.com';
const CATEGORIES = [
  { label: 'Love', emoji: '❤️', color: '#EC4899' },
  { label: 'Academic', emoji: '📚', color: '#4F7CFF' },
  { label: 'Hostel', emoji: '🏠', color: '#F97316' },
  { label: 'Funny', emoji: '😂', color: '#22C55E' },
  { label: 'Serious', emoji: '😔', color: '#7C5CFF' },
  { label: 'General', emoji: '🤫', color: '#94A3B8' },
];

export default function CreateConfessionScreen({ navigation }: any) {
  const colors = useColors();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [loading, setLoading] = useState(false);
  const maxChars = 500;

  const submit = async () => {
    if (!content.trim()) return Alert.alert('Empty', 'Please write something to confess!');
    if (content.length > maxChars) return Alert.alert('Too long', `Max ${maxChars} characters`);
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/confessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: content.trim(), category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      Alert.alert('🤫 Confessed!', 'Your confession is now live — anonymously!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to post');
    } finally { setLoading(false); }
  };

  const selectedCat = CATEGORIES.find(c => c.label === category);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, gap: 12 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}
          style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.text, fontSize: 18 }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>🤫 Confess Anonymously</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>

        {/* Anonymous notice */}
        <View style={{ backgroundColor: '#7C5CFF15', borderRadius: 14, padding: 14, borderLeftWidth: 3, borderLeftColor: '#7C5CFF', marginBottom: 20 }}>
          <Text style={{ color: '#7C5CFF', fontSize: 13, fontWeight: '700', marginBottom: 4 }}>🔒 100% Anonymous</Text>
          <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 20 }}>
            Your identity is never revealed. Only your college students can see this confession.
          </Text>
        </View>

        {/* Category */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 }}>CATEGORY</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {CATEGORIES.map(c => (
            <TouchableOpacity key={c.label} onPress={() => setCategory(c.label)}
              style={{
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                backgroundColor: category === c.label ? c.color : colors.card,
                borderWidth: 0.5, borderColor: category === c.label ? c.color : colors.border,
                flexDirection: 'row', alignItems: 'center', gap: 6,
              }}>
              <Text style={{ fontSize: 14 }}>{c.emoji}</Text>
              <Text style={{ color: category === c.label ? '#fff' : colors.textMuted, fontSize: 13, fontWeight: '500' }}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>YOUR CONFESSION</Text>
        <View style={{ position: 'relative', marginBottom: 8 }}>
          <TextInput
            value={content} onChangeText={setContent}
            placeholder="I have a confession... 🤫"
            placeholderTextColor={colors.textDim}
            multiline numberOfLines={8}
            maxLength={maxChars}
            style={{
              backgroundColor: colors.card, borderRadius: 16, padding: 16,
              color: colors.text, fontSize: 16, lineHeight: 26,
              borderWidth: content.length > maxChars * 0.9 ? 1 : 0.5,
              borderColor: content.length > maxChars * 0.9 ? '#EF4444' : colors.border,
              minHeight: 180, textAlignVertical: 'top',
            }}
          />
        </View>
        <Text style={{
          color: content.length > maxChars * 0.9 ? '#EF4444' : colors.textDim,
          fontSize: 12, textAlign: 'right', marginBottom: 24,
        }}>
          {content.length}/{maxChars}
        </Text>

        {/* Submit */}
        <TouchableOpacity onPress={submit} disabled={loading || !content.trim()}
          style={{
            backgroundColor: loading || !content.trim() ? colors.cardAlt : (selectedCat?.color ?? '#7C5CFF'),
            borderRadius: 16, padding: 16, alignItems: 'center',
          }}>
          {loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Posting...</Text>
            </View>
          ) : (
            <Text style={{ color: content.trim() ? '#fff' : colors.textDim, fontSize: 15, fontWeight: '700' }}>
              🤫 Post Confession
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}