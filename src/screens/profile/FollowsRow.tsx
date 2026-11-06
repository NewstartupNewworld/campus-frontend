import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '../../theme/ThemeProvider';

const API_URL = 'https://campus-backend-arfy.onrender.com';

/** Two tiles for the Profile screen: who follows me and who I follow. Tap one to see the list. */
export default function FollowsRow() {
  const colors = useColors();
  const navigation = useNavigation<any>();
  const [counts, setCounts] = useState({ followers: 0, following: 0 });

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const raw = await AsyncStorage.getItem('user');
          const myId = raw ? JSON.parse(raw).id : null;
          const token = await AsyncStorage.getItem('token');
          if (!myId) return;
          const res = await fetch(`${API_URL}/api/social/users/${myId}`, { headers: { Authorization: `Bearer ${token}` } });
          const data = await res.json();
          if (res.ok && active) {
            setCounts({ followers: data.user?.followers_count ?? 0, following: data.user?.following_count ?? 0 });
          }
        } catch {
          // Keep the old numbers
        }
      })();
      return () => { active = false; };
    }, [])
  );

  const Tile = ({ label, value, kind }: { label: string; value: number; kind: 'followers' | 'following' }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('FollowList', { userId: 'me', kind })}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`${value} ${label}`}
      style={{ flex: 1, alignItems: 'center', gap: 2, backgroundColor: colors.card, borderRadius: 16, borderWidth: 0.5, borderColor: colors.border, paddingVertical: 14 }}
    >
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 11.5 }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <Tile label="Followers" value={counts.followers} kind="followers" />
      <Tile label="Following" value={counts.following} kind="following" />
    </View>
  );
}