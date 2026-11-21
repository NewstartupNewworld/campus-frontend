import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, AlertButton } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../../theme/ThemeProvider';
import { uploadLocalImage } from '../../utils/chatUpload';
import { thumb } from '../../utils/img';
import ImageViewer from '../../components/ImageViewer';

const API_URL = 'https://campus-backend-arfy.onrender.com';
const PRIMARY = '#2F54EB';
type IconName = React.ComponentProps<typeof Ionicons>['name'];

type Entry = {
  id?: string; college: string; level: string;
  start_year: number | null; end_year: number | null; status: string; proof_url?: string | null;
};
type Extras = {
  coverUrl: string | null; avatarUrl: string | null; isSelf: boolean;
  followers: number; following: number; education: Entry[];
};

const LEVEL_LABEL: Record<string, string> = {
  current: 'Current college', primary: 'Primary school', secondary: 'Secondary school (Class 10)',
  school: 'School', senior_secondary: 'Higher secondary (Class 12)', diploma: 'Diploma / ITI',
  bachelor: "UG (Bachelor's)", master: "PG (Master's)", phd: 'PhD', professional: 'Professional course', other: 'Other',
};
const LEVEL_ICON: Record<string, IconName> = {
  current: 'business-outline', primary: 'school-outline', secondary: 'school-outline', school: 'school-outline',
  senior_secondary: 'school-outline', diploma: 'construct-outline', bachelor: 'library-outline',
  master: 'library-outline', phd: 'ribbon-outline', professional: 'briefcase-outline', other: 'ellipse-outline',
};
const STATUS_COLOR: Record<string, string> = { approved: '#22C55E', pending: '#F59E0B', rejected: '#EF4444' };
const STATUS_TEXT: Record<string, string> = { pending: 'Waiting for approval', rejected: 'Not approved' };

// userId is a student id, or "me" for the signed-in student
function useExtras(userId: string, refreshKey = 0) {
  const [data, setData] = useState<Extras | null>(null);
  const load = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/profile/${userId}/extras`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (res.ok) {
        setData({
          coverUrl: json.coverUrl ?? null, avatarUrl: json.avatarUrl ?? null, isSelf: !!json.isSelf,
          followers: Number(json.followers) || 0, following: Number(json.following) || 0,
          education: json.education ?? [],
        });
      }
    } catch {
      // Keep what is shown
    }
  }, [userId, refreshKey]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  return { data, setData };
}

/** A round button that sits on top of the cover photo. */
export function HeroButton({
  onPress, label, badge, children,
}: { onPress: () => void; label: string; badge?: number; children: React.ReactNode }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}
    >
      {children}
      {badge && badge > 0 ? (
        <View style={{ position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

/** The rounded buttons next to the profile photo (Edit profile, Follow, Message). */
export function HeroPill({
  icon, label, onPress, primary, busy, disabled,
}: { icon?: IconName; label: string; onPress?: () => void; primary?: boolean; busy?: boolean; disabled?: boolean }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={busy || disabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        minHeight: 40, borderRadius: 20, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 6, backgroundColor: primary ? PRIMARY : colors.card,
        borderWidth: 1, borderColor: primary ? PRIMARY : colors.border, opacity: busy ? 0.7 : 1,
      }}
    >
      {busy ? (
        <ActivityIndicator size="small" color={primary ? '#fff' : colors.text} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={16} color={primary ? '#fff' : colors.text} /> : null}
          <Text style={{ color: primary ? '#fff' : colors.text, fontWeight: '700', fontSize: 13.5 }}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

type HeroProps = {
  userId: string;
  handle: string;
  name?: string;
  showHandle?: boolean;
  college: string;
  meta?: string;
  verified: boolean;
  joined?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  actions?: React.ReactNode;
  extraStats?: { label: string; value: number | string }[];
  counts?: { followers: number; following: number };
  refreshKey?: number;
};

/** Cover photo, profile photo, name, college and the counts, like Instagram and Facebook. */
export function ProfileHero(props: HeroProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { data, setData } = useExtras(props.userId, props.refreshKey ?? 0);
  const [busy, setBusy] = useState<'cover' | 'avatar' | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);

  const isSelf = props.userId === 'me' || !!data?.isSelf;
  const coverUrl = data?.coverUrl ?? null;
  const avatarUrl = data?.avatarUrl ?? null;
  const followers = props.counts?.followers ?? data?.followers ?? 0;
  const following = props.counts?.following ?? data?.following ?? 0;

  const savePhoto = async (kind: 'cover' | 'avatar', url: string | null) => {
    const token = await AsyncStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/profile/${kind}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(kind === 'cover' ? { coverUrl: url } : { avatarUrl: url }),
    });
    if (!res.ok) throw new Error('Could not save the photo');
    setData((prev) => (prev ? (kind === 'cover' ? { ...prev, coverUrl: url } : { ...prev, avatarUrl: url }) : prev));
  };

  const pick = async (kind: 'cover' | 'avatar') => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission needed', 'Please allow access to your photos.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: kind === 'cover' ? [16, 9] : [1, 1], quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;
    try {
      setBusy(kind);
      const uploaded = await uploadLocalImage(result.assets[0].uri);
      await savePhoto(kind, uploaded.url);
    } catch (e: any) {
      Alert.alert('Could not update', e?.message ?? 'Please check your internet and try again.');
    } finally {
      setBusy(null);
    }
  };

  const choose = (kind: 'cover' | 'avatar') => {
    const has = kind === 'cover' ? !!coverUrl : !!avatarUrl;
    const buttons: AlertButton[] = [{ text: 'Choose a photo', onPress: () => pick(kind) }];
    if (has) {
      buttons.push({
        text: 'Remove photo', style: 'destructive',
        onPress: () => savePhoto(kind, null).catch(() => Alert.alert('Could not remove', 'Please try again.')),
      });
    }
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert(
      kind === 'cover' ? 'Cover photo' : 'Profile photo',
      kind === 'cover' ? 'Use a photo of your school or college.' : 'Students of your college can see your profile photo.',
      buttons
    );
  };

  const stats: { label: string; value: number | string; onPress?: () => void }[] = [
    { label: 'Followers', value: followers, onPress: () => navigation.navigate('FollowList', { userId: props.userId, kind: 'followers' }) },
    { label: 'Following', value: following, onPress: () => navigation.navigate('FollowList', { userId: props.userId, kind: 'following' }) },
    ...(props.extraStats ?? []),
  ];

  return (
    <View>
      {/* Cover */}
      <View style={{ height: 150 + insets.top, backgroundColor: colors.card }}>
        {coverUrl ? (
          <TouchableOpacity activeOpacity={0.95} onPress={() => setViewing(coverUrl)} style={{ flex: 1 }} accessibilityRole="imagebutton" accessibilityLabel="Open cover photo">
            <Image source={{ uri: thumb(coverUrl, 1200) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          </TouchableOpacity>
        ) : (
          <LinearGradient colors={[PRIMARY, '#7C5CFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 56 }}>
            {isSelf ? <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12.5, fontWeight: '600' }}>Add a photo of your school or college</Text> : null}
          </LinearGradient>
        )}
        <View style={{ position: 'absolute', top: insets.top + 8, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>{props.left}</View>
          <View style={{ flexDirection: 'row', gap: 8 }}>{props.right}</View>
        </View>
        {isSelf ? (
          <TouchableOpacity
            onPress={() => choose('cover')}
            disabled={busy === 'cover'}
            accessibilityRole="button"
            accessibilityLabel="Change cover photo"
            style={{ position: 'absolute', right: 12, bottom: 12, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}
          >
            {busy === 'cover' ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={18} color="#fff" />}
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        {/* Profile photo and buttons */}
        <View style={{ marginTop: -48, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => (isSelf ? choose('avatar') : avatarUrl ? setViewing(avatarUrl) : undefined)}
            accessibilityRole="button"
            accessibilityLabel={isSelf ? 'Change profile photo' : 'Profile photo'}
          >
            {avatarUrl ? (
              <Image source={{ uri: thumb(avatarUrl, 300) }} style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 4, borderColor: colors.bg, backgroundColor: colors.card }} />
            ) : (
              <View style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 4, borderColor: colors.bg, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 30, fontWeight: '800' }}>{(props.name || props.handle).slice(0, 2).toUpperCase()}</Text>
              </View>
            )}
            {isSelf ? (
              <View style={{ position: 'absolute', right: 0, bottom: 2, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
                {busy === 'avatar' ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={13} color="#fff" />}
              </View>
            ) : null}
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 6 }}>{props.actions}</View>
        </View>

        {/* Names */}
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 10 }} numberOfLines={1}>{props.name || props.handle}</Text>
        {props.showHandle ? <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 1 }} numberOfLines={1}>@{props.handle}</Text> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <Ionicons name="school-outline" size={15} color={colors.accent} />
          <Text style={{ color: colors.accent, fontSize: 13.5, fontWeight: '700', flexShrink: 1 }} numberOfLines={1}>{props.college}</Text>
        </View>
        {props.meta ? <Text style={{ color: colors.textMuted, fontSize: 12.5, marginTop: 3 }}>{props.meta}</Text> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: (props.verified ? '#22C55E' : colors.textMuted) + '2E' }}>
            <Ionicons name={props.verified ? 'checkmark-circle' : 'alert-circle-outline'} size={12} color={props.verified ? '#22C55E' : colors.textMuted} />
            <Text style={{ color: props.verified ? '#22C55E' : colors.textMuted, fontSize: 11, fontWeight: '700' }}>{props.verified ? 'Verified' : 'Not verified'}</Text>
          </View>
          {props.joined ? <Text style={{ color: colors.textMuted, fontSize: 12 }}>Since {props.joined}</Text> : null}
        </View>

        {/* Counts */}
        <View style={{ flexDirection: 'row', marginTop: 14, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, paddingVertical: 12 }}>
          {stats.map((s, i) => (
            <TouchableOpacity
              key={s.label}
              disabled={!s.onPress}
              onPress={s.onPress}
              activeOpacity={0.7}
              accessibilityRole={s.onPress ? 'button' : undefined}
              accessibilityLabel={`${s.value} ${s.label}`}
              style={{ flex: 1, alignItems: 'center', gap: 2, borderLeftWidth: i === 0 ? 0 : 1, borderLeftColor: colors.border }}
            >
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>{s.value}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 11.5 }}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ImageViewer uri={viewing} onClose={() => setViewing(null)} />
    </View>
  );
}

/** Where the student studied: current college first, then the others from the highest level down. */
export function EducationSection({ userId }: { userId: string }) {
  const colors = useColors();
  const { data } = useExtras(userId);
  const [viewing, setViewing] = useState<string | null>(null);

  if (!data) return null;
  const list = data.education;
  if (!data.isSelf && list.length <= 1) return null;

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 0.5, borderColor: colors.border, padding: 14 }}>
      <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800', marginBottom: 10 }}>Education</Text>
      {list.map((e, i) => {
        const years = [e.start_year, e.end_year].filter(Boolean).join(' - ');
        const showStatus = data.isSelf && e.status !== 'approved';
        return (
          <View key={e.id ?? `current-${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderTopWidth: i === 0 ? 0 : 0.5, borderTopColor: colors.border }}>
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={LEVEL_ICON[e.level] ?? 'ellipse-outline'} size={19} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }} numberOfLines={2}>{e.college}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>{LEVEL_LABEL[e.level] ?? 'Other'}{years ? `  |  ${years}` : ''}</Text>
              {showStatus ? <Text style={{ color: STATUS_COLOR[e.status] ?? colors.textMuted, fontSize: 11, fontWeight: '700', marginTop: 3 }}>{STATUS_TEXT[e.status] ?? e.status}</Text> : null}
            </View>
            {data.isSelf && e.proof_url ? (
              <TouchableOpacity onPress={() => setViewing(e.proof_url ?? null)} accessibilityRole="imagebutton" accessibilityLabel="Open your proof photo">
                <Image source={{ uri: thumb(e.proof_url, 160) }} style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: colors.bg }} />
              </TouchableOpacity>
            ) : null}
          </View>
        );
      })}
      <ImageViewer uri={viewing} onClose={() => setViewing(null)} />
    </View>
  );
}
// END OF FILE