import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, FlatList, Image, ActivityIndicator, StatusBar, RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../../theme/ThemeProvider';
import { thumb } from '../../utils/img';

const API_URL = 'https://campus-backend-arfy.onrender.com';

type Subject = { subject: string; papers: number; latest_year: number | null };
type Paper = {
  id: string; subject: string; exam_type: string; exam_year: number | null; semester: string | null;
  author: string; page_count: number; cover: string | null;
};

export default function PYQHubScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<'library' | 'analyse'>('library');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const searchRef = useRef('');

  const load = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const params = new URLSearchParams();
      if (active) params.append('subject', active);
      if (searchRef.current.trim()) params.append('q', searchRef.current.trim());
      const [s, p] = await Promise.all([
        fetch(`${API_URL}/api/pyq/subjects`, { headers }),
        fetch(`${API_URL}/api/pyq/papers?${params}`, { headers }),
      ]);
      const sd = await s.json();
      const pd = await p.json();
      if (!s.ok || !p.ok) throw new Error('failed');
      setSubjects(sd.subjects ?? []);
      setPapers(pd.papers ?? []);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [active]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const Chip = ({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: on ? colors.accent : colors.card, borderWidth: 0.5, borderColor: on ? colors.accent : colors.border }}
    >
      <Text style={{ color: on ? '#fff' : colors.textMuted, fontSize: 13, fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 10 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ flex: 1, color: colors.text, fontSize: 22, fontWeight: '800' }}>Previous year papers</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddPYQ')}
          accessibilityRole="button" accessibilityLabel="Add a paper"
          style={{ backgroundColor: colors.accent, borderRadius: 12, paddingHorizontal: 14, minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', marginHorizontal: 16, marginBottom: 10, backgroundColor: colors.card, borderRadius: 14, padding: 4 }}>
        {([['library', 'Papers'], ['analyse', 'AI analysis']] as const).map(([key, text]) => (
          <TouchableOpacity key={key} onPress={() => setTab(key)} style={{ flex: 1, minHeight: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: tab === key ? colors.accent : 'transparent' }}>
            <Text style={{ color: tab === key ? '#fff' : colors.textMuted, fontWeight: '700', fontSize: 13 }}>{text}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'analyse' ? (
        <View style={{ margin: 16, backgroundColor: colors.card, borderRadius: 18, padding: 18, gap: 10 }}>
          <Ionicons name="sparkles-outline" size={26} color={colors.accent} />
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>Find the important topics</Text>
          <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 19 }}>
            Paste the questions from past papers and the AI shows which topics repeat the most and what to study first.
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('PYQAnalyse')} style={{ marginTop: 4, minHeight: 46, borderRadius: 14, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>Open AI analysis</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
            <TextInput
              value={search}
              onChangeText={(v) => { setSearch(v); searchRef.current = v; }}
              placeholder="Search subject..."
              placeholderTextColor={colors.textDim}
              returnKeyType="search"
              onSubmitEditing={() => { setLoading(true); load(); }}
              style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14, borderWidth: 0.5, borderColor: colors.border }}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 0 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 12 }}>
            <Chip label="All subjects" on={active === null} onPress={() => { setLoading(true); setActive(null); }} />
            {subjects.map((s) => (
              <Chip key={s.subject} label={`${s.subject} (${s.papers})`} on={active === s.subject.toLowerCase()} onPress={() => { setLoading(true); setActive(s.subject.toLowerCase()); }} />
            ))}
          </ScrollView>

          {loading ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
          ) : failed && papers.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 40, gap: 8, paddingHorizontal: 24 }}>
              <Ionicons name="cloud-offline-outline" size={32} color={colors.textMuted} />
              <Text style={{ color: colors.text, fontWeight: '700' }}>Could not load the papers</Text>
              <TouchableOpacity onPress={() => { setLoading(true); load(); }} style={{ marginTop: 8, minHeight: 44, borderRadius: 22, backgroundColor: colors.accent, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={papers}
              keyExtractor={(p) => p.id}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.accent} />}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', marginTop: 50, gap: 8, paddingHorizontal: 20 }}>
                  <Ionicons name="document-text-outline" size={42} color={colors.textDim} />
                  <Text style={{ color: colors.text, fontWeight: '700' }}>No papers yet</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center' }}>
                    Add the papers of your past exams so every student of your college can study from them.
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const meta = [item.exam_type, item.exam_year, item.semester].filter(Boolean).join('  |  ');
                return (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('PYQPaper', { id: item.id })}
                    activeOpacity={0.8}
                    style={{ flexDirection: 'row', gap: 12, backgroundColor: colors.card, borderRadius: 16, borderWidth: 0.5, borderColor: colors.border, padding: 12, marginBottom: 10 }}
                  >
                    {item.cover ? (
                      <Image source={{ uri: thumb(item.cover, 200) }} style={{ width: 64, height: 78, borderRadius: 10, backgroundColor: colors.bg }} />
                    ) : (
                      <View style={{ width: 64, height: 78, borderRadius: 10, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="document-text-outline" size={26} color={colors.textDim} />
                      </View>
                    )}
                    <View style={{ flex: 1, justifyContent: 'center', gap: 3 }}>
                      <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800' }} numberOfLines={2}>{item.subject}</Text>
                      <Text style={{ color: colors.accent, fontSize: 12.5, fontWeight: '700' }}>{meta}</Text>
                      <Text style={{ color: colors.textDim, fontSize: 11.5 }}>{item.page_count} page{item.page_count === 1 ? '' : 's'}  |  by {item.author}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ alignSelf: 'center' }} />
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </>
      )}
    </View>
  );
}
// END OF FILE