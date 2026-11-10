import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StatusBar, Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../../theme/ThemeProvider';
import { pickMedia, uploadMedia, PickedMedia } from '../../utils/media';

const BASE_URL = 'https://campus-backend-arfy.onrender.com';
const CATEGORIES = ['Phone', 'Wallet', 'Keys', 'Laptop', 'ID Card', 'Books', 'Clothes', 'Other'];

export default function CreateLostFoundScreen({ navigation }: any) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<'lost' | 'found'>('lost');
  const [category, setCategory] = useState('Other');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [contact, setContact] = useState('');
  const [media, setMedia] = useState<PickedMedia | null>(null);
  const [saving, setSaving] = useState(false);

  const isLost = type === 'lost';
  const accent = '#F97316';

  const choose = async (source: 'library' | 'camera') => {
    try {
      const picked = await pickMedia(source);
      if (picked) setMedia(picked);
    } catch (e: any) {
      Alert.alert('Cannot use this file', e?.message ?? 'Please choose another one.');
    }
  };

  const submit = async () => {
    if (saving) return;
    if (!title.trim()) {
      Alert.alert('Title needed', 'Please add a short title, like "Black wallet".');
      return;
    }
    try {
      setSaving(true);
      const imageUrl = media ? await uploadMedia(media) : null;
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/lost-found`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type,
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          category,
          contact: contact.trim(),
          imageUrl,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not post your item');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Could not post', e?.message ?? 'Please check your internet and try again.');
    } finally {
      setSaving(false);
    }
  };

  const label = { color: colors.textMuted, fontSize: 11, fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: 0.6, marginTop: 18, marginBottom: 8 };
  const input = { backgroundColor: colors.card, borderRadius: 12, padding: 13, color: colors.text, fontSize: 14, borderWidth: 0.5, borderColor: colors.border };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>Post Item</Text>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>
        {/* Type */}
        <Text style={{ ...label, marginTop: 6 }}>Type</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {([
            { key: 'lost', text: 'I Lost Something', icon: 'sad-outline', color: '#EF4444' },
            { key: 'found', text: 'I Found Something', icon: 'checkmark-circle-outline', color: '#22C55E' },
          ] as const).map((t) => {
            const active = type === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setType(t.key)}
                style={{ flex: 1, minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, backgroundColor: active ? t.color : colors.card, borderWidth: 0.5, borderColor: active ? t.color : colors.border }}
              >
                <Ionicons name={t.icon} size={17} color={active ? '#fff' : colors.textMuted} />
                <Text style={{ color: active ? '#fff' : colors.textMuted, fontWeight: '700', fontSize: 13 }}>{t.text}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Category */}
        <Text style={label}>Category</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CATEGORIES.map((c) => {
            const active = category === c;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => setCategory(c)}
                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: active ? accent : colors.card, borderWidth: 0.5, borderColor: active ? accent : colors.border }}
              >
                <Text style={{ color: active ? '#fff' : colors.textMuted, fontSize: 13, fontWeight: '600' }}>{c}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={label}>Title *</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder={isLost ? 'e.g. Lost black iPhone 13' : 'e.g. Found a blue water bottle'} placeholderTextColor={colors.textDim} maxLength={100} style={input} />

        <Text style={label}>Description</Text>
        <TextInput value={description} onChangeText={setDescription} placeholder="Add more details: color, brand, when and where..." placeholderTextColor={colors.textDim} multiline textAlignVertical="top" maxLength={500} style={{ ...input, minHeight: 100 }} />

        {/* Photo or video */}
        <Text style={label}>Photo or video (optional)</Text>
        {media ? (
          <View style={{ marginBottom: 10 }}>
            {media.kind === 'image' ? (
              <Image source={{ uri: media.uri }} style={{ width: '100%', height: 180, borderRadius: 14 }} resizeMode="cover" />
            ) : (
              <View style={{ height: 120, borderRadius: 14, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="videocam" size={34} color="#fff" />
                <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 4 }}>Video selected</Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => setMedia(null)}
              accessibilityRole="button"
              accessibilityLabel="Remove the photo or video"
              style={{ position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity onPress={() => choose('camera')} disabled={saving} style={{ flex: 1, minHeight: 46, borderRadius: 12, backgroundColor: colors.card, borderWidth: 0.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}>
            <Ionicons name="camera-outline" size={18} color={colors.text} />
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => choose('library')} disabled={saving} style={{ flex: 1, minHeight: 46, borderRadius: 12, backgroundColor: colors.card, borderWidth: 0.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}>
            <Ionicons name="images-outline" size={18} color={colors.text} />
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>Gallery</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ color: colors.textDim, fontSize: 11.5, marginTop: 6 }}>Video: up to 30 seconds and 30 MB.</Text>

        <Text style={label}>Location</Text>
        <TextInput value={location} onChangeText={setLocation} placeholder="e.g. Main library, Canteen, Hostel A" placeholderTextColor={colors.textDim} maxLength={120} style={input} />

        <Text style={label}>Contact (optional)</Text>
        <TextInput value={contact} onChangeText={setContact} placeholder="Students can also message you in the app" placeholderTextColor={colors.textDim} maxLength={120} style={input} />

        <TouchableOpacity
          onPress={submit}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Post item"
          style={{ marginTop: 26, minHeight: 52, borderRadius: 14, backgroundColor: accent, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, opacity: saving ? 0.7 : 1 }}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name={isLost ? 'sad-outline' : 'checkmark-circle-outline'} size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{isLost ? 'Post Lost Item' : 'Post Found Item'}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}