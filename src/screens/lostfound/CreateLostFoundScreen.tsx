import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '../../theme/ThemeProvider';

const BASE_URL = 'https://campus-backend-arfy.onrender.com';
const CATEGORIES = ['Phone', 'Wallet', 'Keys', 'Laptop', 'ID Card', 'Books', 'Clothes', 'Other'];

export default function CreateLostFoundScreen({ navigation }: any) {
  const colors = useColors();
  const [type, setType] = useState<'lost' | 'found'>('lost');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('Other');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!title.trim()) return Alert.alert('Missing', 'Please enter a title');
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/lost-found`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type, title, description, location, category, contact }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      Alert.alert('✅ Posted!', 'Your post is now live on campus feed', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to post');
    } finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, gap: 12 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}
          style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.text, fontSize: 18 }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>🔍 Post Item</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>

        {/* Lost / Found toggle */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>TYPE</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <TouchableOpacity onPress={() => setType('lost')}
            style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: type === 'lost' ? '#EF4444' : colors.card, borderWidth: 0.5, borderColor: type === 'lost' ? '#EF4444' : colors.border }}>
            <Text style={{ color: type === 'lost' ? '#fff' : colors.textMuted, fontSize: 16 }}>😢 I Lost Something</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setType('found')}
            style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: type === 'found' ? '#22C55E' : colors.card, borderWidth: 0.5, borderColor: type === 'found' ? '#22C55E' : colors.border }}>
            <Text style={{ color: type === 'found' ? '#fff' : colors.textMuted, fontSize: 16 }}>✅ I Found Something</Text>
          </TouchableOpacity>
        </View>

        {/* Category */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>CATEGORY</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {CATEGORIES.map(c => (
            <TouchableOpacity key={c} onPress={() => setCategory(c)}
              style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: category === c ? '#F97316' : colors.card, borderWidth: 0.5, borderColor: category === c ? '#F97316' : colors.border }}>
              <Text style={{ color: category === c ? '#fff' : colors.textMuted, fontSize: 13 }}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Title */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>TITLE *</Text>
        <TextInput value={title} onChangeText={setTitle}
          placeholder={type === 'lost' ? 'e.g. Lost black iPhone 13' : 'e.g. Found blue wallet near canteen'}
          placeholderTextColor={colors.textDim}
          style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14, borderWidth: 0.5, borderColor: colors.border, marginBottom: 16 }}
        />

        {/* Description */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>DESCRIPTION</Text>
        <TextInput value={description} onChangeText={setDescription}
          placeholder="Add more details — color, brand, when/where lost..."
          placeholderTextColor={colors.textDim} multiline numberOfLines={4}
          style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14, borderWidth: 0.5, borderColor: colors.border, marginBottom: 16, minHeight: 100, textAlignVertical: 'top' }}
        />

        {/* Location */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>LOCATION</Text>
        <TextInput value={location} onChangeText={setLocation}
          placeholder="e.g. Main library, Canteen, Hostel A"
          placeholderTextColor={colors.textDim}
          style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14, borderWidth: 0.5, borderColor: colors.border, marginBottom: 16 }}
        />

        {/* Contact */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>CONTACT (optional)</Text>
        <TextInput value={contact} onChangeText={setContact}
          placeholder="Phone number or email"
          placeholderTextColor={colors.textDim}
          keyboardType="phone-pad"
          style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14, borderWidth: 0.5, borderColor: colors.border, marginBottom: 24 }}
        />

        {/* Submit */}
        <TouchableOpacity onPress={submit} disabled={loading}
          style={{ backgroundColor: loading ? colors.cardAlt : '#F97316', borderRadius: 16, padding: 16, alignItems: 'center' }}>
          {loading ? <ActivityIndicator color="#fff" /> :
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>
              {type === 'lost' ? '😢 Post Lost Item' : '✅ Post Found Item'}
            </Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}