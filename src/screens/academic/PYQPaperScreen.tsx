import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../../theme/ThemeProvider';
import { thumb } from '../../utils/img';
import ImageViewer from '../../components/ImageViewer';

const API_URL = 'https://campus-backend-arfy.onrender.com';

type Paper = {
  id: string; subject: string; exam_type: string; exam_year: number | null; semester: string | null;
  note: string | null; author: string; mine: boolean;
};

export default function PYQPaperScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const id: string = route.params?.id;
  const [paper, setPaper] = useState<Paper | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setFailed(false);
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/pyq/papers/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPaper(data.paper);
      setPages(data.pages ?? []);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const remove = () =>
    Alert.alert('Delete this paper?', 'It will be removed for everyone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/pyq/papers/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error('failed');
            navigation.goBack();
          } catch {
            Alert.alert('Could not delete', 'Please try again.');
          }
        },
      },
    ]);

  const meta = paper ? [paper.exam_type, paper.exam_year, paper.semester].filter(Boolean).join('  |  ') : '';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ flex: 1, color: colors.text, fontSize: 20, fontWeight: '800' }} numberOfLines={1}>{paper?.subject ?? 'Paper'}</Text>
        {paper?.mine ? (
          <TouchableOpacity onPress={remove} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }} accessibilityRole="button" accessibilityLabel="Delete this paper">
            <Ionicons name="trash-outline" size={21} color={colors.danger} />
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 50 }} />
      ) : failed || !paper ? (
        <View style={{ alignItems: 'center', marginTop: 50, gap: 8, paddingHorizontal: 24 }}>
          <Ionicons name="alert-circle-outline" size={32} color={colors.textMuted} />
          <Text style={{ color: colors.text, fontWeight: '700' }}>Could not open this paper</Text>
          <TouchableOpacity onPress={load} style={{ marginTop: 8, minHeight: 44, borderRadius: 22, backgroundColor: colors.accent, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 12 }}>
          <View>
            <Text style={{ color: colors.accent, fontSize: 14, fontWeight: '700' }}>{meta}</Text>
            <Text style={{ color: colors.textDim, fontSize: 12, marginTop: 3 }}>Added by {paper.author}</Text>
            {paper.note ? <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 8 }}>{paper.note}</Text> : null}
          </View>
          {pages.map((url, i) => (
            <TouchableOpacity key={url + i} activeOpacity={0.9} onPress={() => setViewing(url)} accessibilityRole="imagebutton" accessibilityLabel={`Open page ${i + 1}`}>
              <Image source={{ uri: thumb(url, 900) }} style={{ width: '100%', height: 460, borderRadius: 12, backgroundColor: colors.card }} resizeMode="contain" />
              <Text style={{ color: colors.textDim, fontSize: 11.5, textAlign: 'center', marginTop: 4 }}>Page {i + 1} of {pages.length}. Tap to open full screen.</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <ImageViewer uri={viewing} onClose={() => setViewing(null)} />
    </View>
  );
}
// END OF FILE