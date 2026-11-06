import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, StatusBar } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../../theme/ThemeProvider';

const API_URL = 'https://campus-backend-arfy.onrender.com';

type Person = {
  id: string;
  anonymous_handle: string;
  department: string | null;
  year: string | null;
  verified: boolean;
  is_following: boolean;
};

const yearLabel = (y: string | null) => (y ? (/year/i.test(y) ? y : `Year ${y}`) : '');

export default function FollowListScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const userId: string = route.params?.userId ?? 'me';
  const [kind, setKind] = useState<'followers' | 'following'>(route.params?.kind ?? 'followers');
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setFailed(false);
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/follows/${userId}/${kind}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPeople(data.users ?? []);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [userId, kind]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleFollow = async (id: string) => {
    setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, is_following: !p.is_following } : p)));
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/social/users/${id}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, is_following: !!data.following } : p)));
    } catch {
      setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, is_following: !p.is_following } : p)));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
          accessibilityRole="button" accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>Connections</Text>
      </View>

      <View style={{ flexDirection: 'row', marginHorizontal: 16, marginVertical: 10, backgroundColor: colors.card, borderRadius: 14, padding: 4 }}>
        {(['followers', 'following'] as const).map((k) => {
          const active = kind === k;
          return (
            <TouchableOpacity
              key={k}
              onPress={() => setKind(k)}
              style={{ flex: 1, minHeight: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? '#2F54EB' : 'transparent' }}
            >
              <Text style={{ color: active ? '#fff' : colors.textMuted, fontWeight: '700', fontSize: 13 }}>
                {k === 'followers' ? 'Followers' : 'Following'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : failed ? (
        <View style={{ alignItems: 'center', marginTop: 50, paddingHorizontal: 24, gap: 8 }}>
          <Ionicons name="cloud-offline-outline" size={32} color={colors.textMuted} />
          <Text style={{ color: colors.text, fontWeight: '700' }}>Could not load the list</Text>
          <TouchableOpacity
            onPress={load}
            style={{ marginTop: 8, minHeight: 44, borderRadius: 22, backgroundColor: colors.accent, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={people}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 50, gap: 8 }}>
              <Ionicons name="people-outline" size={40} color={colors.textDim} />
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                {kind === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const meta = [item.department, yearLabel(item.year)].filter(Boolean).join('  |  ');
            return (
              <TouchableOpacity
                onPress={() => navigation.navigate('PublicProfile', { userId: item.id })}
                activeOpacity={0.75}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 10 }}
              >
                <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: '#2F54EB', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{item.anonymous_handle.slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14.5 }} numberOfLines={1}>{item.anonymous_handle}</Text>
                    {item.verified ? <Ionicons name="checkmark-circle" size={14} color="#22C55E" /> : null}
                  </View>
                  {meta ? <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>{meta}</Text> : null}
                </View>
                <TouchableOpacity
                  onPress={() => toggleFollow(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{ paddingHorizontal: 14, minHeight: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: item.is_following ? colors.cardAlt : colors.accent }}
                >
                  <Text style={{ color: item.is_following ? colors.textMuted : '#fff', fontWeight: '700', fontSize: 12.5 }}>
                    {item.is_following ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}