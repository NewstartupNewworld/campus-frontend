import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, StatusBar, RefreshControl, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '../../theme/ThemeProvider';

const BASE_URL = 'https://campus-backend-arfy.onrender.com';
const CATEGORIES = ['All', 'Love', 'Academic', 'Hostel', 'Funny', 'Serious', 'General'];

const CAT_CONFIG: Record<string, { emoji: string; color: string }> = {
  Love:     { emoji: '❤️', color: '#EC4899' },
  Academic: { emoji: '📚', color: '#4F7CFF' },
  Hostel:   { emoji: '🏠', color: '#F97316' },
  Funny:    { emoji: '😂', color: '#22C55E' },
  Serious:  { emoji: '😔', color: '#7C5CFF' },
  General:  { emoji: '🤫', color: '#94A3B8' },
};

type Confession = {
  id: number;
  content: string;
  category: string;
  likes_count: number;
  is_liked: boolean;
  created_at: string;
};

export default function ConfessionsScreen({ navigation }: any) {
  const colors = useColors();
  const [confessions, setConfessions] = useState<Confession[]>([]);
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
      setConfessions(data.confessions ?? []);
    } catch { } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleLike = async (id: number) => {
    try {
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/api/confessions/${id}/like`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setConfessions(prev => prev.map(c => c.id === id ? {
        ...c,
        is_liked: data.liked,
        likes_count: data.liked ? c.likes_count + 1 : c.likes_count - 1,
      } : c));
    } catch { }
  };

  const reportConfession = async (id: number) => {
    Alert.alert('Report?', 'Report this confession as inappropriate?', [
      { text: 'Cancel' },
      {
        text: 'Report', style: 'destructive', onPress: async () => {
          const token = await getToken();
          await fetch(`${BASE_URL}/api/confessions/${id}/report`, {
            method: 'POST', headers: { Authorization: `Bearer ${token}` },
          });
          setConfessions(prev => prev.filter(c => c.id !== id));
          Alert.alert('✅ Reported', 'Thank you for keeping the campus safe!');
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
          <Text style={{ color: colors.text, fontSize: 26, fontWeight: '700' }}>Confessions 🤫</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CreateConfession')}
            style={{ backgroundColor: '#7C5CFF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 }}>
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>+ Confess</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ color: colors.textMuted, fontSize: 14 }}>Anonymous · Only your campus sees this</Text>
      </View>

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 12 }}>
        {CATEGORIES.map(c => {
          const config = CAT_CONFIG[c];
          return (
            <TouchableOpacity key={c} onPress={() => setCategory(c)}
              style={{
                paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
                backgroundColor: category === c ? (config?.color ?? '#7C5CFF') : colors.card,
                borderWidth: 0.5, borderColor: category === c ? (config?.color ?? '#7C5CFF') : colors.border,
                flexDirection: 'row', alignItems: 'center', gap: 4,
              }}>
              {config && <Text style={{ fontSize: 12 }}>{config.emoji}</Text>}
              <Text style={{ color: category === c ? '#fff' : colors.textMuted, fontSize: 13, fontWeight: '500' }}>{c}</Text>
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
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🤫</Text>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 8 }}>No confessions yet</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
                Be the first to confess anonymously!
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('CreateConfession')}
                style={{ backgroundColor: '#7C5CFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>🤫 Confess Now</Text>
              </TouchableOpacity>
            </View>
          ) : confessions.map(confession => {
            const config = CAT_CONFIG[confession.category] ?? CAT_CONFIG['General'];
            return (
              <View key={confession.id} style={{ backgroundColor: colors.card, borderRadius: 18, padding: 16, borderWidth: 0.5, borderColor: colors.border }}>
                {/* Top */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: `${config.color}22`, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 18 }}>{config.emoji}</Text>
                    </View>
                    <View>
                      <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '600' }}>Anonymous</Text>
                      <Text style={{ color: colors.textDim, fontSize: 11 }}>{timeAgo(confession.created_at)}</Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: `${config.color}22`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                    <Text style={{ color: config.color, fontSize: 11, fontWeight: '600' }}>{confession.category}</Text>
                  </View>
                </View>

                {/* Content */}
                <Text style={{ color: colors.text, fontSize: 15, lineHeight: 24, marginBottom: 14 }}>
                  {confession.content}
                </Text>

                {/* Actions */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <TouchableOpacity onPress={() => toggleLike(confession.id)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: confession.is_liked ? '#EC489922' : colors.cardAlt, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 }}>
                    <Text style={{ fontSize: 16 }}>{confession.is_liked ? '❤️' : '🤍'}</Text>
                    <Text style={{ color: confession.is_liked ? '#EC4899' : colors.textMuted, fontSize: 13, fontWeight: '600' }}>
                      {confession.likes_count}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => reportConfession(confession.id)}
                    style={{ marginLeft: 'auto', padding: 8 }}>
                    <Text style={{ color: colors.textDim, fontSize: 12 }}>⚑ Report</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
      </ScrollView>
    </View>
  );
}