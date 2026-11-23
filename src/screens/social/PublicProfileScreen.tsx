import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StatusBar, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../../theme/ThemeProvider';
import { prettyCollege } from '../../utils/format';
import { ProfileHero, HeroButton, HeroPill, EducationSection } from '../profile/ProfileExtras';

const API_URL = 'https://campus-backend-arfy.onrender.com';

type PublicUser = {
  id: string; anonymous_handle: string; student_name?: string | null; college: string; department: string | null; year: string | null;
  verified: boolean; trust_score: number | null; created_at: string;
  followers_count: number; following_count: number; is_following: boolean;
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
      const res = await fetch(`${API_URL}/api/social/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
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
      const res = await fetch(`${API_URL}/api/social/users/${user.id}/follow`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUser({ ...user, is_following: !!data.following, followers_count: data.followers_count });
    } catch {
      Alert.alert('Could not update', 'Please check your internet and try again.');
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
      "You will not see each other's posts and cannot message each other. You can unblock from Settings, Blocked students.",
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

  if (loading || failed || !user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
        <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 60 }} />
        ) : (
          <View style={{ alignItems: 'center', marginTop: 50, paddingHorizontal: 24, gap: 8 }}>
            <Ionicons name="alert-circle-outline" size={34} color={colors.textMuted} />
            <Text style={{ color: colors.text, fontWeight: '700' }}>Could not open this profile</Text>
            <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center' }}>It may belong to a student of another college, or your internet is slow.</Text>
            <TouchableOpacity onPress={load} style={{ marginTop: 8, minHeight: 44, borderRadius: 22, backgroundColor: colors.accent, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  const meta = [user.department, yearLabel(user.year)].filter(Boolean).join('  |  ');
  const joined = user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <ProfileHero
          userId={user.id}
          handle={user.anonymous_handle}
          name={user.student_name || undefined}
          college={prettyCollege(user.college)}
          meta={meta}
          verified={user.verified}
          joined={joined}
          counts={{ followers: user.followers_count, following: user.following_count }}
          extraStats={[{ label: 'Trust', value: user.trust_score ?? 0 }]}
          left={
            <HeroButton onPress={() => navigation.goBack()} label="Go back">
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </HeroButton>
          }
          right={
            !isMe ? (
              <HeroButton onPress={confirmBlock} label="Block this student">
                <Ionicons name="ban-outline" size={20} color="#fff" />
              </HeroButton>
            ) : undefined
          }
          actions={
            isMe ? undefined : (
              <>
                <HeroPill icon={user.is_following ? 'checkmark' : 'person-add'} label={user.is_following ? 'Following' : 'Follow'} primary={!user.is_following} busy={busy} onPress={toggleFollow} />
                <HeroPill icon="chatbubble-ellipses-outline" label="Message" busy={opening} onPress={openChat} />
              </>
            )
          }
        />
        <View style={{ paddingHorizontal: 16, marginTop: 14, gap: 14 }}>
          {isMe ? (
            <View style={{ alignItems: 'center', padding: 14, borderRadius: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>This is your profile</Text>
            </View>
          ) : null}
          <EducationSection userId={user.id} />
        </View>
      </ScrollView>
    </View>
  );
}
// END OF FILE