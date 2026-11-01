import React, { useCallback, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal, ScrollView, ActivityIndicator, Alert, Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../theme/ThemeProvider';
import { useKeyboardPadding } from '../../utils/useKeyboardPadding';
import { uploadLocalImage } from '../../utils/chatUpload';

const API_URL = 'https://campus-backend-arfy.onrender.com';

type Entry = {
  id: string;
  college: string;
  level: string;
  start_year: number | null;
  end_year: number | null;
  status: 'pending' | 'approved' | 'rejected';
};

const LEVELS: { key: string; label: string }[] = [
  { key: 'school', label: 'School (10th)' },
  { key: 'senior_secondary', label: 'Class 12' },
  { key: 'bachelor', label: "Bachelor's" },
  { key: 'master', label: "Master's" },
  { key: 'phd', label: 'PhD' },
  { key: 'professional', label: 'Professional' },
  { key: 'other', label: 'Other' },
];
const levelLabel = (key: string) => LEVELS.find((l) => l.key === key)?.label ?? 'Other';

const STATUS: Record<Entry['status'], { label: string; color: string }> = {
  approved: { label: 'Approved', color: '#22C55E' },
  pending: { label: 'Waiting for approval', color: '#F59E0B' },
  rejected: { label: 'Not approved', color: '#EF4444' },
};

/**
 * A row for the Profile screen. Opens a sheet where the student sees the college from signup
 * and adds the others (school, bachelor's, master's, PhD ...). Each new college needs a proof photo
 * and shows up in Buzz, groups and clubs once it is approved.
 */
export default function MyCollegesRow({ onChanged }: { onChanged?: () => void }) {
  const colors = useColors();
  const { rootRef, onLayout, pad } = useKeyboardPadding({ modal: true });

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [main, setMain] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [level, setLevel] = useState('master');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [proofUri, setProofUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const getToken = async () => await AsyncStorage.getItem('token');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/social/colleges`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMain(data.main ?? '');
      setEntries(data.colleges ?? []);
    } catch (e: any) {
      Alert.alert('Could not load', e?.message ?? 'Check your internet and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const openSheet = () => {
    setOpen(true);
    setAdding(false);
    load();
  };

  const resetForm = () => {
    setName('');
    setLevel('master');
    setStartYear('');
    setEndYear('');
    setProofUri(null);
  };

  const pickProof = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access to upload your proof.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled && result.assets.length > 0) setProofUri(result.assets[0].uri);
  };

  const submit = async () => {
    if (saving) return;
    if (name.trim().length < 3) return Alert.alert('College name', 'Please enter the full college name.');
    if (!proofUri) return Alert.alert('Proof needed', 'Please add a photo of your ID card or admission proof for this college.');
    try {
      setSaving(true);
      const uploaded = await uploadLocalImage(proofUri);
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/social/colleges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          college: name.trim(),
          level,
          startYear: startYear.trim() ? Number(startYear) : null,
          endYear: endYear.trim() ? Number(endYear) : null,
          proofUrl: uploaded.url,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not add this college');

      resetForm();
      setAdding(false);
      await load();
      onChanged?.();
      Alert.alert('Submitted', 'We will check your proof. Once approved, this college appears in your Buzz, groups and clubs.');
    } catch (e: any) {
      Alert.alert('Could not add', e?.message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const remove = (entry: Entry) => {
    Alert.alert('Remove college?', `${entry.college} will be removed from your profile.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/api/social/colleges/${entry.id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Could not remove');
            await load();
            onChanged?.();
          } catch (e: any) {
            Alert.alert('Could not remove', e?.message ?? 'Please try again.');
          }
        },
      },
    ]);
  };

  const label = { color: colors.textMuted, fontSize: 11, fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: 0.6, marginTop: 14, marginBottom: 8 };
  const input = { backgroundColor: colors.bg, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14 };

  return (
    <>
      <TouchableOpacity
        onPress={openSheet}
        activeOpacity={0.75}
        style={{
          backgroundColor: colors.card, borderColor: colors.border, borderWidth: 0.5,
          borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
        }}
        accessibilityRole="button"
        accessibilityLabel="My colleges"
      >
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#22C55E22', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="school-outline" size={20} color="#22C55E" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}>My colleges</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>School, bachelor's, master's, PhD</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setOpen(false)}>
        <View
          ref={rootRef}
          collapsable={false}
          onLayout={onLayout}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end', paddingBottom: pad }}
        >
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' }}>
            <View style={{ width: 36, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginTop: 10 }} />
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 28 }}>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900', marginBottom: 4 }}>My colleges</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12.5, lineHeight: 18 }}>
                Add every college you studied in. After approval you also see their Buzz, groups, clubs and listings.
              </Text>

              {/* Main college */}
              <Text style={label}>Main college</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.bg, borderRadius: 12, padding: 12 }}>
                <Ionicons name="lock-closed" size={15} color={colors.textMuted} />
                <Text style={{ flex: 1, color: colors.text, fontSize: 14 }} numberOfLines={1}>{main || 'Your college'}</Text>
              </View>

              {/* Added colleges */}
              <Text style={label}>Other colleges</Text>
              {loading ? (
                <ActivityIndicator color={colors.accent} style={{ marginVertical: 14 }} />
              ) : entries.length === 0 ? (
                <Text style={{ color: colors.textDim, fontSize: 13 }}>You have not added another college yet.</Text>
              ) : (
                entries.map((e) => {
                  const st = STATUS[e.status] ?? STATUS.pending;
                  const years = [e.start_year, e.end_year].filter(Boolean).join(' - ');
                  return (
                    <View key={e.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.bg, borderRadius: 12, padding: 12, marginBottom: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }} numberOfLines={2}>{e.college}</Text>
                        <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                          {levelLabel(e.level)}{years ? `  |  ${years}` : ''}
                        </Text>
                        <View style={{ alignSelf: 'flex-start', marginTop: 6, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: st.color + '2E' }}>
                          <Text style={{ color: st.color, fontSize: 11, fontWeight: '700' }}>{st.label}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => remove(e)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${e.college}`}
                      >
                        <Ionicons name="trash-outline" size={18} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}

              {!adding ? (
                <TouchableOpacity
                  onPress={() => setAdding(true)}
                  style={{ marginTop: 10, minHeight: 48, borderRadius: 14, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}
                  accessibilityRole="button"
                  accessibilityLabel="Add a college"
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '800' }}>Add a college</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ marginTop: 6 }}>
                  <Text style={label}>College name</Text>
                  <TextInput value={name} onChangeText={setName} placeholder="e.g. IIT Bombay" placeholderTextColor={colors.textDim} maxLength={255} style={input} />

                  <Text style={label}>What did you study there?</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {LEVELS.map((l) => {
                      const active = level === l.key;
                      return (
                        <TouchableOpacity
                          key={l.key}
                          onPress={() => setLevel(l.key)}
                          style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, backgroundColor: active ? colors.accent : colors.bg }}
                        >
                          <Text style={{ color: active ? '#fff' : colors.textMuted, fontSize: 12.5, fontWeight: '600' }}>{l.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={label}>From (year)</Text>
                      <TextInput value={startYear} onChangeText={setStartYear} placeholder="2022" placeholderTextColor={colors.textDim} keyboardType="number-pad" maxLength={4} style={input} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={label}>To (year)</Text>
                      <TextInput value={endYear} onChangeText={setEndYear} placeholder="2026" placeholderTextColor={colors.textDim} keyboardType="number-pad" maxLength={4} style={input} />
                    </View>
                  </View>

                  <Text style={label}>Proof (ID card or admission photo)</Text>
                  {proofUri ? (
                    <Image source={{ uri: proofUri }} resizeMode="contain" style={{ width: '100%', height: 150, borderRadius: 12, backgroundColor: colors.bg, marginBottom: 8 }} />
                  ) : null}
                  <TouchableOpacity
                    onPress={pickProof}
                    disabled={saving}
                    style={{ minHeight: 46, borderRadius: 12, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
                  >
                    <Ionicons name="image-outline" size={18} color={colors.text} />
                    <Text style={{ color: colors.text, fontWeight: '600' }}>{proofUri ? 'Choose a different photo' : 'Choose photo'}</Text>
                  </TouchableOpacity>

                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 18 }}>
                    <TouchableOpacity
                      onPress={() => { resetForm(); setAdding(false); }}
                      disabled={saving}
                      style={{ flex: 1, backgroundColor: colors.bg, borderRadius: 14, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Text style={{ color: colors.text, fontWeight: '700' }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={submit}
                      disabled={saving}
                      style={{ flex: 2, backgroundColor: colors.accent, borderRadius: 14, minHeight: 48, alignItems: 'center', justifyContent: 'center', opacity: saving ? 0.7 : 1 }}
                    >
                      {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800' }}>Submit for approval</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <TouchableOpacity
                onPress={() => setOpen(false)}
                style={{ marginTop: 14, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: colors.textMuted, fontWeight: '700' }}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}