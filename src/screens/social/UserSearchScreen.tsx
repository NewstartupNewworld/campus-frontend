import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../../theme/ThemeProvider';

const API_URL = 'https://campus-backend-arfy.onrender.com';

type Student = {
  id: string;
  anonymous_handle: string;
  department: string | null;
  year: string | null;
  verified: boolean;
  is_following: boolean;
};

const yearLabel = (y: string | null) => (y ? (/year/i.test(y) ? y : `Year ${y}`) : '');

export default function UserSearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const [query, setQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const latest = useRef(0);

  const search = useCallback(async (q: string) => {
    const mine = ++latest.current;
    try {
      setLoading(true);
      setFailed(false);
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/social/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (mine !== latest.current) return;
      if (!res.ok) throw new Error(data.error);
      setStudents(data.users ?? []);
    } catch {
      if (mine === latest.current) setFailed(true);
    } finally {
      if (mine === latest.current) setLoading(false);
    }
  }, []);

  // Wait a moment after typing stops, then search
  useEffect(() => {
    const t = setTimeout(() => search(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query, search]);

  const toggleFollow = async (id: string) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, is_following: !s.is_following } : s)));
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/social/users/${id}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, is_following: !!data.following } : s)));
    } catch {
      // Put the button back the way it was
      setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, is_following: !s.is_following } : s)));
    }
  };

  const renderItem = ({ item }: { item: Student }) => {
    const meta = [item.department, yearLabel(item.year)].filter(Boolean).join('  |  ');
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('PublicProfile', { userId: item.id })}
        activeOpacity={0.75}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card,
          borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 10,
        }}
        accessibilityRole="button"
        accessibilityLabel={`Open profile of ${item.anonymous_handle}`}
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
          style={{
            paddingHorizontal: 14, minHeight: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
            backgroundColor: item.is_following ? colors.cardAlt : colors.accent,
          }}
          accessibilityRole="button"
          accessibilityLabel={item.is_following ? `Unfollow ${item.anonymous_handle}` : `Follow ${item.anonymous_handle}`}
        >
          <Text style={{ color: item.is_following ? colors.textMuted : '#fff', fontWeight: '700', fontSize: 12.5 }}>
            {item.is_following ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
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
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>People</Text>
      </View>
      <Text style={{ color: colors.textMuted, fontSize: 13, paddingHorizontal: 20, marginBottom: 10 }}>
        Students of your college
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 12, backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 }}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by handle, e.g. NightPanda"
          placeholderTextColor={colors.textDim}
          autoCapitalize="none"
          autoCorrect={false}
          style={{ flex: 1, color: colors.text, fontSize: 14, paddingVertical: 12 }}
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {loading && students.length === 0 ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : failed ? (
        <View style={{ alignItems: 'center', marginTop: 50, paddingHorizontal: 24, gap: 8 }}>
          <Ionicons name="cloud-offline-outline" size={32} color={colors.textMuted} />
          <Text style={{ color: colors.text, fontWeight: '700' }}>Could not search</Text>
          <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center' }}>Check your internet and try again.</Text>
          <TouchableOpacity
            onPress={() => search(query.trim())}
            style={{ marginTop: 8, minHeight: 44, borderRadius: 22, backgroundColor: colors.accent, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(s) => s.id}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 50, gap: 8 }}>
              <Ionicons name="people-outline" size={40} color={colors.textDim} />
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                {query ? 'No student found with that handle.' : 'No other students from your college yet.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}