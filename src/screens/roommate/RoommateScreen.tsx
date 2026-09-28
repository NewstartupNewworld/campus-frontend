import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, StatusBar, RefreshControl, Alert, Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '../../theme/ThemeProvider';

const BASE_URL = 'https://campus-backend-arfy.onrender.com';

const HABIT_EMOJIS: Record<string, string> = {
  'Early bird': '🌅', 'Night owl': '🦉', 'Non-smoker': '🚭',
  'Smoker': '🚬', 'Non-drinker': '🚫', 'Vegetarian': '🥗',
  'Gym goer': '💪', 'Introvert': '📚', 'Extrovert': '🎉',
  'Clean freak': '🧹', 'Pet friendly': '🐾', 'Music lover': '🎵',
};

type Profile = {
  id: number;
  user_id: string;
  anonymous_handle: string;
  trust_score: number;
  year: number;
  budget_min: number;
  budget_max: number;
  gender: string;
  habits: string[];
  preferences: string;
  looking_from: string;
  contact: string;
  updated_at: string;
};

export default function RoommateScreen({ navigation }: any) {
  const colors = useColors();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'browse' | 'my'>('browse');

  useEffect(() => { fetchAll(); }, []);

  const getToken = async () => await AsyncStorage.getItem('token');

  const fetchAll = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const [profilesRes, myRes] = await Promise.all([
        fetch(`${BASE_URL}/api/roommate`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BASE_URL}/api/roommate/my`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const profilesData = await profilesRes.json();
      const myData = await myRes.json();
      setProfiles(profilesData.profiles ?? []);
      setMyProfile(myData.profile);
    } catch { } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const deactivateProfile = async () => {
    Alert.alert('Remove Profile?', 'Your roommate profile will be hidden.', [
      { text: 'Cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          const token = await getToken();
          await fetch(`${BASE_URL}/api/roommate/my`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
          });
          setMyProfile(null);
          Alert.alert('✅ Done', 'Your profile has been removed');
        }
      }
    ]);
  };

  const timeAgo = (date: string) => {
    const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return '1d ago';
    return `${days}d ago`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ color: colors.text, fontSize: 26, fontWeight: '700' }}>Roommate 🏠</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CreateRoommate')}
            style={{ backgroundColor: '#22C55E', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 }}>
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>
              {myProfile ? '✏️ Edit' : '+ Post'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={{ color: colors.textMuted, fontSize: 14 }}>Find your perfect campus roommate</Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: colors.card, borderRadius: 14, padding: 4 }}>
        {[{ key: 'browse', label: '🔍 Browse' }, { key: 'my', label: '👤 My Profile' }].map(t => (
          <TouchableOpacity key={t.key} onPress={() => setActiveTab(t.key as any)}
            style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: activeTab === t.key ? '#22C55E' : 'transparent' }}>
            <Text style={{ color: activeTab === t.key ? '#fff' : colors.textMuted, fontSize: 13, fontWeight: '600' }}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingTop: 0, paddingBottom: 100, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor="#22C55E" />}>

        {/* ── MY PROFILE TAB ── */}
        {activeTab === 'my' && (
          myProfile ? (
            <View>
              <View style={{ backgroundColor: '#22C55E15', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#22C55E33', marginBottom: 12 }}>
                <Text style={{ color: '#22C55E', fontSize: 14, fontWeight: '700', marginBottom: 8 }}>✅ Your profile is live!</Text>
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>Budget: ₹{myProfile.budget_min} - ₹{myProfile.budget_max}/month</Text>
                {myProfile.gender && <Text style={{ color: colors.textMuted, fontSize: 13 }}>Gender: {myProfile.gender}</Text>}
                {myProfile.looking_from && <Text style={{ color: colors.textMuted, fontSize: 13 }}>Looking from: {myProfile.looking_from}</Text>}
                {myProfile.preferences && <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 6 }}>{myProfile.preferences}</Text>}
                {myProfile.habits?.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                    {myProfile.habits.map((h: string) => (
                      <View key={h} style={{ backgroundColor: colors.cardAlt, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 }}>
                        <Text style={{ color: colors.textMuted, fontSize: 12 }}>{HABIT_EMOJIS[h] ?? '•'} {h}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('CreateRoommate')}
                style={{ backgroundColor: '#22C55E', borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>✏️ Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={deactivateProfile}
                style={{ backgroundColor: '#EF444422', borderRadius: 14, padding: 14, alignItems: 'center' }}>
                <Text style={{ color: '#EF4444', fontWeight: '600' }}>Remove Profile</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🏠</Text>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 8 }}>No profile yet</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
                Post your roommate preferences to find your perfect match!
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('CreateRoommate')}
                style={{ backgroundColor: '#22C55E', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>+ Create Profile</Text>
              </TouchableOpacity>
            </View>
          )
        )}

        {/* ── BROWSE TAB ── */}
        {activeTab === 'browse' && (
          loading ? <ActivityIndicator color="#22C55E" size="large" style={{ marginTop: 40 }} />
            : profiles.length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 40 }}>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>🏠</Text>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 8 }}>No roommates yet</Text>
                <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center' }}>
                  Be the first to post your roommate profile!
                </Text>
              </View>
            ) : profiles.map(p => (
              <View key={p.id} style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: colors.border }}>
                {/* Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#22C55E22', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#22C55E', fontSize: 14, fontWeight: '700' }}>
                        {p.anonymous_handle?.slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>{p.anonymous_handle}</Text>
                      <Text style={{ color: colors.textDim, fontSize: 12 }}>
                        {p.year ? `Year ${p.year}` : ''} · {timeAgo(p.updated_at)}
                      </Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: '#22C55E22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' }}>
                    <Text style={{ color: '#22C55E', fontSize: 11, fontWeight: '600' }}>⭐ {p.trust_score}</Text>
                  </View>
                </View>

                {/* Budget */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                  {p.budget_min && p.budget_max && (
                    <View style={{ backgroundColor: '#22C55E22', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                      <Text style={{ color: '#22C55E', fontSize: 12, fontWeight: '600' }}>💰 ₹{p.budget_min}-₹{p.budget_max}/mo</Text>
                    </View>
                  )}
                  {p.gender && (
                    <View style={{ backgroundColor: colors.cardAlt, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                      <Text style={{ color: colors.textMuted, fontSize: 12 }}>👤 {p.gender}</Text>
                    </View>
                  )}
                  {p.looking_from && (
                    <View style={{ backgroundColor: colors.cardAlt, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                      <Text style={{ color: colors.textMuted, fontSize: 12 }}>📅 From {p.looking_from}</Text>
                    </View>
                  )}
                </View>

                {/* Preferences */}
                {p.preferences && (
                  <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 20, marginBottom: 10 }} numberOfLines={2}>
                    {p.preferences}
                  </Text>
                )}

                {/* Habits */}
                {p.habits?.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {p.habits.map((h: string) => (
                      <View key={h} style={{ backgroundColor: colors.cardAlt, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 }}>
                        <Text style={{ color: colors.textMuted, fontSize: 11 }}>{HABIT_EMOJIS[h] ?? '•'} {h}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Contact */}
                {p.contact && (
                  <TouchableOpacity onPress={() => Linking.openURL(`tel:${p.contact}`)}
                    style={{ backgroundColor: '#22C55E', borderRadius: 12, padding: 10, alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>📞 Contact</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
        )}
      </ScrollView>
    </View>
  );
}