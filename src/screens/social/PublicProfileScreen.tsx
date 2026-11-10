import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StatusBar, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../../theme/ThemeProvider';
import { CoverBanner, EducationSection } from '../profile/ProfileExtras';

const API_URL = 'https://campus-backend-arfy.onrender.com';

type PublicUser = {
  id: string;
  anonymous_handle: string;
  college: string;
  department: string | null;
  year: string | null;
  verified: boolean;
  trust_score: number | null;
  created_at: string;
  followers_count: number;
  following_count: number;
  is_following: boolean;
};

const yearLabel = (y: string | null) => (y ? (/year/i.test(y) ? y : `Year ${y}`) : '');

export default function PublicProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const userId: string = route.params?.userId;

  const [user, setUser] = useState<PublicUser | null>(null);
  const [isMe, setIsMe] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [opening, setOpening] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setFailed(false);
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/social/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUser(data.user);
      setIsMe(!!data.is_me);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const toggleFollow = async () => {
    if (!user || busy) return;
    setBusy(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/social/users/${user.id}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUser({ ...user, is_following: !!data.following, followers_count: data.followers_count });
    } catch {
      // Leave the button as it was
    } finally {
      setBusy(false);
    }
  };

  const openChat = async () => {
    if (!user || opening) return;
    try {
      setOpening(true);
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/dm/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not open the chat');
      navigation.navigate('DirectChat', { chatId: data.chatId, handle: data.other?.handle ?? user.anonymous_handle });
    } catch (e: any) {
      Alert.alert('Could not message', e?.message ?? 'Please try again.');
    } finally {
      setOpening(false);
    }
  };

  const confirmBlock = () => {
    if (!user) return;
    Alert.alert(
      `Block ${user.anonymous_handle}?`,
      "You will not see each other's posts and cannot message each other. You can unblock from Profile, Blocked students.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              const res = await fetch(`${API_URL}/api/safety/block`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ userId: user.id }),
              });
              if (!res.ok) throw new Error('failed');
              Alert.alert('Blocked', `${user.anonymous_handle} is blocked.`);
              navigation.goBack();
            } catch {
              Alert.alert('Could not block', 'Please try again.');
            }
          },
        },
      ]
    );
  };

  const joined = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '';
  const meta = user ? [user.department, yearLabel(user.year)].filter(Boolean).join('  |  ') : '';

  const Stat = ({ value, label, onPress }: { value: number | string; label: string; onPress?: () => void }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.75}
      accessibilityRole={onPress ? 'button' : undefined}
      style={{ flex: 1, alignItems: 'center', gap: 2, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, paddingVertical: 14 }}
    >
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 11.5 }}>{label}</Text>
    </TouchableOpacity>
  );

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
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>Profile</Text>
        <View style={{ flex: 1 }} />
        {user && !isMe ? (
          <TouchableOpacity
            onPress={confirmBlock}
            style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
            accessibilityRole="button"
            accessibilityLabel="Block this student"
          >
            <Ionicons name="ban-outline" size={22} color={colors.danger} />
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 60 }} />
      ) : failed || !user ? (
        <View style={{ alignItems: 'center', marginTop: 60, paddingHorizontal: 24, gap: 8 }}>
          <Ionicons name="alert-circle-outline" size={34} color={colors.textMuted} />
          <Text style={{ color: colors.text, fontWeight: '700' }}>Could not open this profile</Text>
          <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center' }}>
            It may belong to a student of another college, or your internet is slow.
          </Text>
          <TouchableOpacity
            onPress={load}
            style={{ marginTop: 8, minHeight: 44, borderRadius: 22, backgroundColor: colors.accent, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 16 }} showsVerticalScrollIndicator={false}><CoverBanner userId={user.id} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: '#2F54EB', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800' }}>{user.anonymous_handle.slice(0, 2).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }} numberOfLines={1}>{user.anonymous_handle}</Text>
              <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{user.college}</Text>
              {meta ? <Text style={{ color: colors.textMuted, fontSize: 12 }}>{meta}</Text> : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: (user.verified ? '#22C55E' : colors.textMuted) + '2E' }}>
                  <Ionicons name={user.verified ? 'checkmark-circle' : 'alert-circle-outline'} size={12} color={user.verified ? '#22C55E' : colors.textMuted} />
                  <Text style={{ color: user.verified ? '#22C55E' : colors.textMuted, fontSize: 11, fontWeight: '700' }}>
                    {user.verified ? 'Verified' : 'Not verified'}
                  </Text>
                </View>
                {joined ? <Text style={{ color: colors.textMuted, fontSize: 12 }}>Since {joined}</Text> : null}
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Stat value={user.followers_count} label="Followers" onPress={() => navigation.navigate('FollowList', { userId: user.id, kind: 'followers' })} />
            <Stat value={user.following_count} label="Following" onPress={() => navigation.navigate('FollowList', { userId: user.id, kind: 'following' })} />
            <Stat value={user.trust_score ?? 0} label="Trust" />
          </View>

          <EducationSection userId={user.id} />{isMe ? (
            <View style={{ alignItems: 'center', padding: 14, borderRadius: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>This is your profile</Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={toggleFollow}
                disabled={busy}
                style={{
                  flex: 1, minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
                  backgroundColor: user.is_following ? colors.card : colors.accent,
                  borderWidth: 1, borderColor: user.is_following ? colors.border : colors.accent,
                  opacity: busy ? 0.7 : 1,
                }}
                accessibilityRole="button"
                accessibilityLabel={user.is_following ? 'Unfollow' : 'Follow'}
              >
                {busy ? (
                  <ActivityIndicator color={user.is_following ? colors.text : '#fff'} />
                ) : (
                  <>
                    <Ionicons name={user.is_following ? 'checkmark' : 'person-add'} size={17} color={user.is_following ? colors.text : '#fff'} />
                    <Text style={{ color: user.is_following ? colors.text : '#fff', fontWeight: '800', fontSize: 14.5 }}>
                      {user.is_following ? 'Following' : 'Follow'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={openChat}
                disabled={opening}
                style={{
                  flex: 1, minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
                  backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, opacity: opening ? 0.7 : 1,
                }}
                accessibilityRole="button"
                accessibilityLabel="Message"
              >
                {opening ? (
                  <ActivityIndicator color={colors.text} />
                ) : (
                  <>
                    <Ionicons name="chatbubble-ellipses-outline" size={17} color={colors.text} />
                    <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14.5 }}>Message</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}