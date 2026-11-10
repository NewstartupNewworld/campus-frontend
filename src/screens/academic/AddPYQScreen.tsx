import React, { useCallback, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../../theme/ThemeProvider';
import { uploadLocalImage } from '../../utils/chatUpload';

const API_URL = 'https://campus-backend-arfy.onrender.com';
const EXAM_TYPES = ['Mid sem', 'End sem', 'Quiz', 'Practical', 'Backlog', 'Other'];
const MAX_PAGES = 12;

export default function AddPYQScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [subject, setSubject] = useState('');
  const [examType, setExamType] = useState('End sem');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [semester, setSemester] = useState('');
  const [note, setNote] = useState('');
  const [pages, setPages] = useState<string[]>([]);
  const [known, setKnown] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState('');

  // Subjects other students already added, so the same name can be picked with one tap
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          const res = await fetch(`${API_URL}/api/pyq/subjects`, { headers: { Authorization: `Bearer ${token}` } });
          const data = await res.json();
          if (res.ok) setKnown((data.subjects ?? []).map((s: { subject: string }) => s.subject));
        } catch {
          // The list is only a shortcut
        }
      })();
    }, [])
  );

  const addFromGallery = async () => {
    const left = MAX_PAGES - pages.length;
    if (left <= 0) return Alert.alert('Limit reached', `You can add up to ${MAX_PAGES} photos.`);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed', 'Please allow access to your photos.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: left, quality: 0.7 });
    if (!result.canceled) setPages((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, MAX_PAGES));
  };

  const addFromCamera = async () => {
    if (pages.length >= MAX_PAGES) return Alert.alert('Limit reached', `You can add up to ${MAX_PAGES} photos.`);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed', 'Please allow camera access.');
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets.length > 0) setPages((prev) => [...prev, result.assets[0].uri]);
  };

  const submit = async () => {
    if (saving) return;
    if (subject.trim().length < 2) return Alert.alert('Subject needed', 'Please enter the subject name.');
    if (pages.length === 0) return Alert.alert('Add the paper', 'Please add at least one photo of the paper.');
    try {
      setSaving(true);
      const urls: string[] = [];
      for (let i = 0; i < pages.length; i++) {
        setProgress(`Uploading photo ${i + 1} of ${pages.length}...`);
        urls.push((await uploadLocalImage(pages[i])).url);
      }
      setProgress('Saving...');
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/pyq/papers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject: subject.trim(), examType, examYear: year.trim() ? Number(year) : null, semester: semester.trim(), note: note.trim(), pages: urls }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save the paper');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Could not add', e?.message ?? 'Please check your internet and try again.');
    } finally {
      setSaving(false);
      setProgress('');
    }
  };

  const label = { color: colors.textMuted, fontSize: 11, fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: 0.6, marginTop: 18, marginBottom: 8 };
  const input = { backgroundColor: colors.card, borderRadius: 12, padding: 13, color: colors.text, fontSize: 14, borderWidth: 0.5, borderColor: colors.border };
  const suggestions = known.filter((k) => subject.trim() && k.toLowerCase().includes(subject.trim().toLowerCase()) && k.toLowerCase() !== subject.trim().toLowerCase()).slice(0, 5);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>Add a paper</Text>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}>
        <Text style={{ ...label, marginTop: 6 }}>Subject *</Text>
        <TextInput value={subject} onChangeText={setSubject} placeholder="e.g. Data Structures" placeholderTextColor={colors.textDim} maxLength={100} style={input} />
        {suggestions.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {suggestions.map((s) => (
              <TouchableOpacity key={s} onPress={() => setSubject(s)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: colors.accent + '22' }}>
                <Text style={{ color: colors.accent, fontSize: 12.5, fontWeight: '600' }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <Text style={label}>Exam</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {EXAM_TYPES.map((t) => (
            <TouchableOpacity key={t} onPress={() => setExamType(t)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: examType === t ? colors.accent : colors.card, borderWidth: 0.5, borderColor: examType === t ? colors.accent : colors.border }}>
              <Text style={{ color: examType === t ? '#fff' : colors.textMuted, fontSize: 13, fontWeight: '600' }}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={label}>Year</Text>
            <TextInput value={year} onChangeText={setYear} placeholder="2025" placeholderTextColor={colors.textDim} keyboardType="number-pad" maxLength={4} style={input} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={label}>Semester</Text>
            <TextInput value={semester} onChangeText={setSemester} placeholder="e.g. Sem 4" placeholderTextColor={colors.textDim} maxLength={30} style={input} />
          </View>
        </View>

        <Text style={label}>Note (optional)</Text>
        <TextInput value={note} onChangeText={setNote} placeholder="e.g. Set B, Prof. name, important questions" placeholderTextColor={colors.textDim} maxLength={300} multiline style={{ ...input, minHeight: 70, textAlignVertical: 'top' }} />

        <Text style={label}>Photos of the paper * ({pages.length}/{MAX_PAGES})</Text>
        {pages.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
            {pages.map((uri, i) => (
              <View key={uri + i}>
                <Image source={{ uri }} style={{ width: 92, height: 120, borderRadius: 10, backgroundColor: colors.card }} />
                <TouchableOpacity onPress={() => setPages((prev) => prev.filter((_, idx) => idx !== i))} accessibilityRole="button" accessibilityLabel={`Remove photo ${i + 1}`}
                  style={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity onPress={addFromCamera} disabled={saving} style={{ flex: 1, minHeight: 46, borderRadius: 12, backgroundColor: colors.card, borderWidth: 0.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}>
            <Ionicons name="camera-outline" size={18} color={colors.text} />
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={addFromGallery} disabled={saving} style={{ flex: 1, minHeight: 46, borderRadius: 12, backgroundColor: colors.card, borderWidth: 0.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}>
            <Ionicons name="images-outline" size={18} color={colors.text} />
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>Gallery (many)</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={submit} disabled={saving} accessibilityRole="button" accessibilityLabel="Add the paper"
          style={{ marginTop: 26, minHeight: 52, borderRadius: 14, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, opacity: saving ? 0.8 : 1 }}>
          {saving ? (
            <>
              <ActivityIndicator color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13.5 }}>{progress}</Text>
            </>
          ) : (
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Add paper</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
// END OF FILE