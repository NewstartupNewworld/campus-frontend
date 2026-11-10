import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, StatusBar, RefreshControl, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../theme/ThemeProvider';
import EngageBar from '../../components/EngageBar';
import MediaView from '../../components/MediaView';
import { EngageSummary, fetchEngageSummary } from '../../utils/engage';

const BASE_URL = 'https://campus-backend-arfy.onrender.com';
const CATEGORIES = ['All', 'Love', 'Academic', 'Hostel', 'Funny', 'Serious', 'General'];

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const CAT_CONFIG: Record<string, { icon: IconName; color: string }> = {
  Love:     { icon: 'heart', color: '#EC4899' },
  Academic: { icon: 'book', color: '#4F7CFF' },
  Hostel:   { icon: 'home', color: '#F97316' },
  Funny:    { icon: 'happy', color: '#22C55E' },
  Serious:  { icon: 'sad', color: '#7C5CFF' },
  General:  { icon: 'chatbubble-ellipses', color: '#94A3B8' },
};

type Confession = {
  id: string | number;
  content: string;
  image_url?: string | null;
  category: string;
  created_at: string;
};

export default function ConfessionsScreen({ navigation }: any) {
  const colors = useColors();
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [summary, setSummary] = useState<Record<string, EngageSummary>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState('All');

  useEffect(() => { fetchConfessions(); }, [category]);

  const getToken = async () => await AsyncStorage.getItem('token');

  const fetchConfessions = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const params = category !== 'All' ? `?category=${category}` : '';
      const res = await fetch(`${BASE_URL}/api/confessions${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const list: Confession[] = data.confessions ?? [];
      setConfessions(list);
      setSummary(await fetchEngageSummary('confession', list.map((c) => String(c.id))));
    } catch { } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const reportConfession = async (id: string | number) => {
    Alert.alert('Report?', 'Report this confession as inappropriate?', [
      { text: 'Cancel' },
      {
        text: 'Report', style: 'destructive', onPress: async () => {
          const token = await getToken();
          await fetch(`${BASE_URL}/api/confessions/${id}/report`, {
            method: 'POST', headers: { Authorization: `Bearer ${token}` },
          });
          setConfessions(prev => prev.filter(c => c.id !== id));
          Alert.alert('Reported', 'Thank you for keeping the campus safe!');
        }
      }
    ]);
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ color: colors.text, fontSize: 26, fontWeight: '700' }}>Confessions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CreateConfession')}
            style={{ backgroundColor: '#7C5CFF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Confess</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ color: colors.textMuted, fontSize: 14 }}>Anonymous · Only your campus sees this</Text>
      </View>

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, flexShrink: 0 }}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 12 }}>
        {CATEGORIES.map(c => {
          const config = CAT_CONFIG[c];
          const active = category === c;
          return (
            <TouchableOpacity key={c} onPress={() => setCategory(c)}
              style={{
                paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
                backgroundColor: active ? (config?.color ?? '#7C5CFF') : colors.card,
                borderWidth: 0.5, borderColor: active ? (config?.color ?? '#7C5CFF') : colors.border,
                flexDirection: 'row', alignItems: 'center', gap: 5,
              }}>
              {config ? <Ionicons name={config.icon} size={13} color={active ? '#fff' : colors.textMuted} /> : null}
              <Text style={{ color: active ? '#fff' : colors.textMuted, fontSize: 13, fontWeight: '500' }}>{c}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Confessions list */}
      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingTop: 0, paddingBottom: 100, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchConfessions(); }} tintColor="#7C5CFF" />}>

        {loading ? <ActivityIndicator color="#7C5CFF" size="large" style={{ marginTop: 40 }} />
          : confessions.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.textDim} style={{ marginBottom: 12 }} />
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 8 }}>No confessions yet</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
                Be the first to confess anonymously!
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('CreateConfession')}
                style={{ backgroundColor: '#7C5CFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '600' }}>Confess Now</Text>
              </TouchableOpacity>
            </View>
          ) : confessions.map(confession => {
            const config = CAT_CONFIG[confession.category] ?? CAT_CONFIG['General'];
            const key = String(confession.id);
            return (
              <View key={key} style={{ backgroundColor: colors.card, borderRadius: 18, padding: 16, borderWidth: 0.5, borderColor: colors.border }}>
                {/* Top */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: `${config.color}22`, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={config.icon} size={18} color={config.color} />
                    </View>
                    <View>
                      <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '600' }}>Anonymous</Text>
                      <Text style={{ color: colors.textDim, fontSize: 11 }}>{timeAgo(confession.created_at)}</Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: `${config.color}22`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' }}>
                    <Text style={{ color: config.color, fontSize: 11, fontWeight: '600' }}>{confession.category}</Text>
                  </View>
                </View>

                {/* Content */}
                <Text style={{ color: colors.text, fontSize: 15, lineHeight: 24, marginBottom: 14 }}>
                  {confession.content}
                </Text>

                {/* Reactions and comments */}
                {confession.image_url ? <View style={{ marginBottom: 12 }}><MediaView uri={confession.image_url} height={200} /></View> : null}<EngageBar targetType="confession" targetId={key} summary={summary[key]} />

                <TouchableOpacity onPress={() => reportConfession(confession.id)}
                  style={{ alignSelf: 'flex-end', marginTop: 10, padding: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="flag-outline" size={13} color={colors.textDim} />
                  <Text style={{ color: colors.textDim, fontSize: 12 }}>Report</Text>
                </TouchableOpacity>
              </View>
            );
          })}
      </ScrollView>
    </View>
  );
}