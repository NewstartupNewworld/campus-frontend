import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../theme/ThemeProvider';
import { uploadLocalImage } from '../../utils/chatUpload';
import { thumb } from '../../utils/img';
import ImageViewer from '../../components/ImageViewer';

const API_URL = 'https://campus-backend-arfy.onrender.com';
type IconName = React.ComponentProps<typeof Ionicons>['name'];

type Entry = {
  id?: string; college: string; level: string;
  start_year: number | null; end_year: number | null; status: string; proof_url?: string | null;
};
type Extras = { coverUrl: string | null; isSelf: boolean; education: Entry[] };

const LEVEL_LABEL: Record<string, string> = {
  current: 'Current college', school: 'School (10th)', senior_secondary: 'Class 12',
  bachelor: "Bachelor's", master: "Master's", phd: 'PhD', professional: 'Professional course', other: 'Other',
};
const LEVEL_ICON: Record<string, IconName> = {
  current: 'business-outline', school: 'school-outline', senior_secondary: 'school-outline',
  bachelor: 'library-outline', master: 'library-outline', phd: 'ribbon-outline',
  professional: 'briefcase-outline', other: 'ellipse-outline',
};
const STATUS_COLOR: Record<string, string> = { approved: '#22C55E', pending: '#F59E0B', rejected: '#EF4444' };
const STATUS_TEXT: Record<string, string> = { pending: 'Waiting for approval', rejected: 'Not approved' };

// userId is a student id, or "me" for the signed-in student
function useExtras(userId: string) {
  const [data, setData] = useState<Extras | null>(null);
  const load = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/profile/${userId}/extras`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (res.ok) setData(json);
    } catch {
      // Keep what is shown
    }
  }, [userId]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  return { data, setData };
}

/** Wide cover photo (like Facebook). The student can change or remove their own. */
export function CoverBanner({ userId }: { userId: string }) {
  const colors = useColors();
  const { data, setData } = useExtras(userId);
  const [busy, setBusy] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);

  if (!data) return null;
  if (!data.coverUrl && !data.isSelf) return null;

  const save = async (url: string | null) => {
    const token = await AsyncStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/profile/cover`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ coverUrl: url }),
    });
    if (!res.ok) throw new Error('Could not save the cover photo');
    setData((prev) => (prev ? { ...prev, coverUrl: url } : prev));
  };

  const change = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission needed', 'Please allow access to your photos.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [16, 9], quality: 0.8 });
    if (result.canceled || result.assets.length === 0) return;
    try {
      setBusy(true);
      const uploaded = await uploadLocalImage(result.assets[0].uri);
      await save(uploaded.url);
    } catch (e: any) {
      Alert.alert('Could not update', e?.message ?? 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const remove = () =>
    Alert.alert('Remove cover photo?', '', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => save(null).catch(() => Alert.alert('Could not remove', 'Please try again.')) },
    ]);

  if (!data.coverUrl) {
    return (
      <TouchableOpacity
        onPress={change}
        disabled={busy}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Add a cover photo"
        style={{ height: 120, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', gap: 6 }}
      >
        {busy ? <ActivityIndicator color={colors.accent} /> : (
          <>
            <Ionicons name="image-outline" size={26} color={colors.textMuted} />
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13.5 }}>Add a cover photo</Text>
            <Text style={{ color: colors.textDim, fontSize: 11.5 }}>Your current or highest college</Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View>
      <TouchableOpacity activeOpacity={0.9} onPress={() => setViewing(data.coverUrl)} accessibilityRole="imagebutton" accessibilityLabel="Open cover photo">
        <Image source={{ uri: thumb(data.coverUrl, 1000) }} style={{ width: '100%', height: 150, borderRadius: 16, backgroundColor: colors.card }} resizeMode="cover" />
      </TouchableOpacity>
      {data.isSelf ? (
        <View style={{ position: 'absolute', right: 10, bottom: 10, flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={change} disabled={busy} accessibilityRole="button" accessibilityLabel="Change cover photo"
            style={{ minWidth: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}>
            {busy ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="camera" size={18} color="#fff" />}
          </TouchableOpacity>
          <TouchableOpacity onPress={remove} accessibilityRole="button" accessibilityLabel="Remove cover photo"
            style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="trash-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : null}
      <ImageViewer uri={viewing} onClose={() => setViewing(null)} />
    </View>
  );
}

/** Where the student studied: current college first, then the others (school, bachelor's, master's ...). */
export function EducationSection({ userId }: { userId: string }) {
  const colors = useColors();
  const { data } = useExtras(userId);
  const [viewing, setViewing] = useState<string | null>(null);

  if (!data) return null;
  const list = data.education;
  // For other students the first row is already in their profile header, so show this only when there is more
  if (!data.isSelf && list.length <= 1) return null;

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 0.5, borderColor: colors.border, padding: 14 }}>
      <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800', marginBottom: 10 }}>Education</Text>
      {list.map((e, i) => {
        const years = [e.start_year, e.end_year].filter(Boolean).join(' - ');
        const label = LEVEL_LABEL[e.level] ?? 'Other';
        const showStatus = data.isSelf && e.status !== 'approved';
        return (
          <View key={e.id ?? `current-${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderTopWidth: i === 0 ? 0 : 0.5, borderTopColor: colors.border }}>
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={LEVEL_ICON[e.level] ?? 'ellipse-outline'} size={19} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }} numberOfLines={2}>{e.college}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>{label}{years ? `  |  ${years}` : ''}</Text>
              {showStatus ? (
                <Text style={{ color: STATUS_COLOR[e.status] ?? colors.textMuted, fontSize: 11, fontWeight: '700', marginTop: 3 }}>{STATUS_TEXT[e.status] ?? e.status}</Text>
              ) : null}
            </View>
            {data.isSelf && e.proof_url ? (
              <TouchableOpacity onPress={() => setViewing(e.proof_url ?? null)} accessibilityRole="imagebutton" accessibilityLabel="Open your proof photo">
                <Image source={{ uri: thumb(e.proof_url, 160) }} style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: colors.bg }} />
              </TouchableOpacity>
            ) : null}
          </View>
        );
      })}
      <ImageViewer uri={viewing} onClose={() => setViewing(null)} />
    </View>
  );
}
// END OF FILE