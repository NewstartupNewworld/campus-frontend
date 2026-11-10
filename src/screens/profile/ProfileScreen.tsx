import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Switch,
  Alert, Image, TextInput, Modal, DeviceEventEmitter, RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import VerificationRow from './VerificationRow';
import EditProfileRow from './EditProfileRow'; import MyCollegesRow from './MyCollegesRow'; import FollowsRow from './FollowsRow'; import BlockedRow from './BlockedRow'; import AnonymousRow from './AnonymousRow'; import MessagesRow from './MessagesRow';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useColors } from '../../theme/ThemeProvider';
import {
  SOSButtonMode, getSOSButtonMode, setSOSButtonMode, onSOSButtonModeChange,
} from '../../utils/sosButton';

const API_URL = 'https://campus-backend-arfy.onrender.com';
const PRIMARY = '#2F54EB';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface ListingPreview {
  id: string; title: string; price: number | string; status: string; images?: string[];
}
interface RatingItem {
  score: number; comment: string; created_at: string; from_handle: string; listing_title: string;
}
interface Profile {
  handle: string; college: string; department: string; year: string; verified: boolean;
  trustScore: number; joinedAt: string; listings: number; sales: number; buzzPosts: number;
  ratingsCount: number; avgRating: number;
  recentListings: ListingPreview[]; recentRatings: RatingItem[];
}

const timeAgo = (iso: string) => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (isNaN(d) || d < 1) return 'today';
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
};

const getTrust = (score: number, C: any) => {
  if (score >= 90) return { label: 'Legend', color: '#EAB308' };
  if (score >= 75) return { label: 'Trusted', color: C.success };
  if (score >= 50) return { label: 'Good', color: C.accent };
  if (score > 0) return { label: 'Building', color: C.warn };
  return { label: 'New', color: C.textMuted };
};

// Badges are earned from real numbers only
const buildBadges = (p: Profile): { id: string; icon: IconName; label: string; how: string; earned: boolean; color: string }[] => [
  { id: 'verified', icon: 'checkmark-circle', label: 'Verified student', how: 'Verify your college', earned: p.verified, color: '#22C55E' },
  { id: 'firstsale', icon: 'bag-check', label: 'First sale', how: 'Sell your first item', earned: p.sales >= 1, color: '#4F7CFF' },
  { id: 'buzz', icon: 'flash', label: 'Buzz star', how: 'Post 20 times on Buzz', earned: p.buzzPosts >= 20, color: '#F59E0B' },
  { id: 'topseller', icon: 'trophy', label: 'Top seller', how: 'Complete 10 sales', earned: p.sales >= 10, color: '#EAB308' },
  { id: 'rated', icon: 'star', label: 'Well rated', how: '4+ stars from 3 buyers', earned: p.ratingsCount >= 3 && p.avgRating >= 4, color: '#F97316' },
  { id: 'legend', icon: 'ribbon', label: 'Trust legend', how: 'Reach trust score 90', earned: p.trustScore >= 90, color: '#A78BFA' },
];

export const ProfileScreen = () => {
  const Colors = useColors();
  const { isDark, toggleTheme } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'listings' | 'ratings' | 'badges'>('listings');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('');
  const [editNameModal, setEditNameModal] = useState(false);
  const [editNameText, setEditNameText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [sosMode, setSosMode] = useState<SOSButtonMode>('visible');

  useEffect(() => {
    getSOSButtonMode().then(setSosMode);
    return onSOSButtonModeChange(setSosMode);
  }, []);

  const load = useCallback(async () => {
    try {
      const [token, userStr, savedPic] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('profilePic'),
      ]);
      if (savedPic) setProfilePic(savedPic);
      const stored = userStr ? JSON.parse(userStr) : {};
      setStudentName(stored.student_name || '');

      const headers = { Authorization: `Bearer ${token}` };
      const [meRes, nRes] = await Promise.allSettled([
        fetch(`${API_URL}/api/users/me`, { headers }),
        fetch(`${API_URL}/api/notifications`, { headers }),
      ]);

      if (nRes.status === 'fulfilled' && nRes.value.ok) {
        const n = await nRes.value.json();
        setUnreadCount(n.unreadCount || 0);
      }

      if (meRes.status === 'fulfilled' && meRes.value.ok) {
        const d = await meRes.value.json();
        setProfile({
          handle: d.anonymous_handle || stored.anonymous_handle || '',
          college: d.college || stored.college || '',
          department: d.department || stored.department || '',
          year: d.year != null ? String(d.year) : stored.year != null ? String(stored.year) : '',
          verified: !!d.verified,
          trustScore: Number(d.trust_score) || 0,
          joinedAt: d.created_at,
          listings: parseInt(d.listings_count) || 0,
          sales: parseInt(d.sales_count) || 0,
          buzzPosts: parseInt(d.buzz_count) || 0,
          ratingsCount: parseInt(d.ratings_count) || 0,
          avgRating: parseFloat(d.avg_rating) || 0,
          recentListings: d.recentListings || [],
          recentRatings: d.recentRatings || [],
        });
        setFailed(false);
      } else {
        setFailed(true);
      }
    } catch (e) {
      setFailed(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handlePickProfilePic = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setProfilePic(uri);
        await AsyncStorage.setItem('profilePic', uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not pick the photo.');
    }
  };

  const handleSaveName = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : {};
      user.student_name = editNameText.trim();
      await AsyncStorage.setItem('user', JSON.stringify(user));
      setStudentName(editNameText.trim());
      setEditNameModal(false);
    } catch (e) {
      Alert.alert('Error', 'Could not save your name.');
    }
  };

  const toggleSOS = (on: boolean) => {
    if (on) {
      setSOSButtonMode('visible');
      return;
    }
    Alert.alert(
      'Hide the SOS button?',
      'The floating button will disappear. You can still send an alert from Profile > Emergency (SOS).',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Hide', style: 'destructive', onPress: () => setSOSButtonMode('hidden') },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out', style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['token', 'user', 'profilePic']);
          DeviceEventEmitter.emit('auth:logout');
        },
      },
    ]);
  };

  const Header = () => (
    <View style={styles.topBar}>
      <Text style={styles.title}>Profile</Text>
      <TouchableOpacity
        style={styles.iconBtn}
        onPress={() => navigation.navigate('Notifications')}
        accessibilityRole="button"
        accessibilityLabel={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
      >
        <Ionicons name="notifications-outline" size={20} color={Colors.text} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.accent} style={{ marginTop: 80 }} />
      </View>
    );
  }

  if (failed || !profile) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Header />
        <View style={styles.stateWrap}>
          <Ionicons name="cloud-offline-outline" size={34} color={Colors.warn} />
          <Text style={styles.stateTitle}>Could not load your profile</Text>
          <Text style={styles.stateSub}>Check your internet and try again.</Text>
          <TouchableOpacity style={styles.stateBtn} onPress={() => { setLoading(true); load(); }}>
            <Text style={styles.stateBtnText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkRow} onPress={handleLogout}>
            <Text style={{ color: Colors.danger, fontWeight: '700' }}>Log out</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const trust = getTrust(profile.trustScore, Colors);
  const badges = buildBadges(profile);
  const earned = badges.filter((b) => b.earned).length;
  const yearLabel = profile.year ? (/year/i.test(profile.year) ? profile.year : `Year ${profile.year}`) : '';
  const meta = [profile.department, yearLabel].filter(Boolean).join('  |  ');
  const initials = (studentName || profile.handle || '?').slice(0, 2).toUpperCase();
  const joined = profile.joinedAt
    ? new Date(profile.joinedAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '';

  const stats: { icon: IconName; value: number; label: string; onPress: () => void; color: string }[] = [
    { icon: 'pricetag', value: profile.listings, label: 'Listed', color: Colors.accent, onPress: () => setActiveTab('listings') },
    { icon: 'checkmark-circle', value: profile.sales, label: 'Sold', color: Colors.success, onPress: () => setActiveTab('listings') },
    { icon: 'flash', value: profile.buzzPosts, label: 'Buzz posts', color: Colors.warn, onPress: () => navigation.navigate('Buzz') },
    { icon: 'star', value: profile.ratingsCount, label: 'Ratings', color: '#EAB308', onPress: () => setActiveTab('ratings') },
  ];

  const Row = ({
    icon, color, label, sub, onPress, right,
  }: { icon: IconName; color: string; label: string; sub?: string; onPress?: () => void; right?: React.ReactNode }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={label}
    >
      <View style={[styles.rowIcon, { backgroundColor: color + '2E' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {!!sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={Colors.textDim} /> : null)}
    </TouchableOpacity>
  );

  const switchProps = (value: boolean) => ({
    value,
    trackColor: { false: Colors.border, true: Colors.accent + '88' },
    thumbColor: value ? Colors.accent : Colors.textMuted,
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.accent} />
        }
      >
        <Header />

        {/* Identity */}
        <View style={styles.identity}>
          <TouchableOpacity onPress={handlePickProfilePic} accessibilityRole="button" accessibilityLabel="Change profile photo">
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <View style={styles.camBadge}>
              <Ionicons name="camera" size={12} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.handle} numberOfLines={1}>{profile.handle}</Text>
            <TouchableOpacity
              onPress={() => { setEditNameText(studentName); setEditNameModal(true); }}
              style={styles.nameBtn}
              accessibilityRole="button"
              accessibilityLabel="Edit your name"
            >
              <Text style={styles.nameText} numberOfLines={1}>{studentName || 'Add your name'}</Text>
              <Ionicons name="pencil" size={12} color={Colors.textMuted} />
            </TouchableOpacity>
            <Text style={styles.college} numberOfLines={1}>{profile.college}</Text>
            {!!meta && <Text style={styles.meta}>{meta}</Text>}
            <View style={styles.chipRow}>
              <View style={[styles.chip, { backgroundColor: (profile.verified ? Colors.success : Colors.textMuted) + '2E' }]}>
                <Ionicons
                  name={profile.verified ? 'checkmark-circle' : 'alert-circle-outline'}
                  size={12}
                  color={profile.verified ? Colors.success : Colors.textMuted}
                />
                <Text style={[styles.chipText, { color: profile.verified ? Colors.success : Colors.textMuted }]}>
                  {profile.verified ? 'Verified' : 'Not verified'}
                </Text>
              </View>
              {!!joined && <Text style={styles.meta}>Since {joined}</Text>}
            </View>
          </View>
        </View>

        {/* Student verification */}
        <View style={{ marginHorizontal: 16, marginTop: 6 }}>
          <VerificationRow />
        </View>

        {/* Edit profile (college stays locked) */}
        <View style={{ marginHorizontal: 16, marginTop: 10 }}>
          <EditProfileRow onSaved={load} /><View style={{ height: 10 }} /><MyCollegesRow onChanged={load} /><View style={{ height: 10 }} /><MessagesRow /><View style={{ height: 10 }} /><FollowsRow /><View style={{ height: 10 }} /><BlockedRow /><View style={{ height: 10 }} /><AnonymousRow />
        </View>

        {/* Trust score */}
        <View style={styles.card}>
          <View style={styles.trustRow}>
            <View style={[styles.ring, { borderColor: trust.color, backgroundColor: trust.color + '14' }]}>
              <Text style={[styles.ringScore, { color: trust.color }]}>{profile.trustScore}</Text>
              <Text style={styles.ringOf}>/100</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.trustTitleRow}>
                <Text style={styles.cardTitle}>Trust score</Text>
                <View style={[styles.chip, { backgroundColor: trust.color + '2E' }]}>
                  <Text style={[styles.chipText, { color: trust.color }]}>{trust.label}</Text>
                </View>
              </View>
              <Text style={styles.cardSub}>Grows with sales and good ratings from other students.</Text>
              {[
                { label: 'Sales', val: `${profile.sales} of 10`, done: profile.sales >= 10 },
                { label: 'Average rating', val: profile.ratingsCount > 0 ? profile.avgRating.toFixed(1) : 'No ratings yet', done: profile.avgRating >= 4 && profile.ratingsCount > 0 },
                { label: 'Verified', val: profile.verified ? 'Yes' : 'No', done: profile.verified },
              ].map((item) => (
                <View key={item.label} style={styles.trustItem}>
                  <Ionicons
                    name={item.done ? 'checkmark-circle' : 'ellipse-outline'}
                    size={15}
                    color={item.done ? Colors.success : Colors.textDim}
                  />
                  <Text style={styles.trustLabel}>{item.label}</Text>
                  <Text style={styles.trustVal}>{item.val}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {stats.map((s) => (
            <TouchableOpacity
              key={s.label}
              style={styles.statCard}
              onPress={s.onPress}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`${s.value} ${s.label}`}
            >
              <Ionicons name={s.icon} size={18} color={s.color} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {([
            { key: 'listings', label: 'Listings' },
            { key: 'ratings', label: 'Ratings' },
            { key: 'badges', label: `Badges ${earned}/${badges.length}` },
          ] as const).map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, activeTab === t.key && styles.tabActive]}
              onPress={() => setActiveTab(t.key)}
              accessibilityRole="button"
            >
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tabContent}>
          {activeTab === 'listings' && (
            profile.recentListings.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="storefront-outline" size={26} color={Colors.textMuted} />
                <Text style={styles.emptyText}>You have not listed anything yet.</Text>
                <TouchableOpacity
                  style={styles.stateBtn}
                  onPress={() => navigation.navigate('Marketplace', { screen: 'CreateListing' })}
                >
                  <Text style={styles.stateBtnText}>Sell something</Text>
                </TouchableOpacity>
              </View>
            ) : (
              profile.recentListings.map((l) => {
                const sold = l.status === 'sold';
                const color = sold ? Colors.success : Colors.accent;
                const img = Array.isArray(l.images) && l.images.length ? l.images[0] : null;
                return (
                  <View key={l.id} style={styles.listingRow}>
                    {img ? (
                      <Image source={{ uri: img }} style={styles.thumb} />
                    ) : (
                      <View style={[styles.thumb, styles.thumbEmpty]}>
                        <Ionicons name="image-outline" size={18} color={Colors.textDim} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowLabel} numberOfLines={1}>{l.title}</Text>
                      <Text style={styles.price}>{'\u20B9'}{Math.round(Number(l.price))}</Text>
                    </View>
                    <View style={[styles.chip, { backgroundColor: color + '2E' }]}>
                      <Text style={[styles.chipText, { color }]}>{sold ? 'Sold' : 'Active'}</Text>
                    </View>
                  </View>
                );
              })
            )
          )}

          {activeTab === 'ratings' && (
            profile.recentRatings.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="star-outline" size={26} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No ratings yet. Complete a sale to get rated.</Text>
              </View>
            ) : (
              profile.recentRatings.map((r, i) => (
                <View key={i} style={styles.ratingCard}>
                  <View style={styles.ratingTop}>
                    <Text style={styles.ratingHandle} numberOfLines={1}>{r.from_handle}</Text>
                    <View style={{ flexDirection: 'row' }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Ionicons key={n} name={n <= Math.round(r.score) ? 'star' : 'star-outline'} size={13} color="#EAB308" />
                      ))}
                    </View>
                    <Text style={styles.meta}>{timeAgo(r.created_at)}</Text>
                  </View>
                  {!!r.listing_title && <Text style={styles.meta}>About {r.listing_title}</Text>}
                  {!!r.comment && <Text style={styles.ratingComment}>{r.comment}</Text>}
                </View>
              ))
            )
          )}

          {activeTab === 'badges' && (
            <View style={styles.badgeGrid}>
              {badges.map((b) => (
                <View key={b.id} style={[styles.badgeCard, !b.earned && { opacity: 0.55 }]}>
                  <View style={[styles.badgeIcon, { backgroundColor: (b.earned ? b.color : Colors.textMuted) + '2E' }]}>
                    <Ionicons name={b.earned ? b.icon : 'lock-closed'} size={20} color={b.earned ? b.color : Colors.textMuted} />
                  </View>
                  <Text style={styles.badgeLabel}>{b.label}</Text>
                  <Text style={styles.badgeHow}>{b.earned ? 'Earned' : b.how}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsCard}>
            <Row
              icon="notifications"
              color={Colors.accent}
              label="Notifications"
              sub={unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
              onPress={() => navigation.navigate('Notifications')}
            />
            <View style={styles.divider} />
            <Row
              icon="moon"
              color={Colors.accentAlt}
              label="Dark mode"
              right={<Switch {...switchProps(isDark)} onValueChange={toggleTheme} accessibilityLabel="Dark mode" />}
            />
            <View style={styles.divider} />
            <Row
              icon="warning"
              color={Colors.danger}
              label="Show SOS button"
              sub="Hold it for 2 seconds to send an alert"
              right={<Switch {...switchProps(sosMode !== 'hidden')} onValueChange={toggleSOS} accessibilityLabel="Show SOS button" />}
            />
            <View style={styles.divider} />
            <Row
              icon="alert-circle"
              color={Colors.danger}
              label="Emergency (SOS)"
              sub="Open the emergency screen"
              onPress={() => navigation.navigate('SOS')}
            />
            <View style={styles.divider} />
            <Row
              icon="school"
              color={Colors.success}
              label="Cross-college access"
              sub="Ask to see another college"
              onPress={() => navigation.navigate('CollegeAccess')}
            />
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} accessibilityRole="button">
            <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={editNameModal} transparent animationType="fade" onRequestClose={() => setEditNameModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Your name</Text>
            <Text style={styles.cardSub}>Only you see this. Other students see your anonymous handle.</Text>
            <TextInput
              style={styles.modalInput}
              value={editNameText}
              onChangeText={setEditNameText}
              placeholder="Your name"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setEditNameModal(false)}>
                <Text style={{ color: Colors.text, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSaveName}>
                <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const makeStyles = (Colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
    title: { fontSize: 26, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
    iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
    badge: { position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: Colors.danger, borderWidth: 2, borderColor: Colors.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
    badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },

    identity: { flexDirection: 'row', gap: 14, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' },
    avatar: { width: 72, height: 72, borderRadius: 22, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center' },
    avatarImg: { width: 72, height: 72, borderRadius: 22 },
    avatarText: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
    camBadge: { position: 'absolute', right: -4, bottom: -4, width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.accent, borderWidth: 2, borderColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
    handle: { fontSize: 20, fontWeight: '800', color: Colors.text },
    nameBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 28 },
    nameText: { fontSize: 13.5, color: Colors.textMuted, fontWeight: '600' },
    college: { fontSize: 13, color: Colors.accent, fontWeight: '700' },
    meta: { fontSize: 12, color: Colors.textMuted },
    chipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    chipText: { fontSize: 11, fontWeight: '700' },

    card: { marginHorizontal: 16, marginTop: 12, backgroundColor: Colors.card, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16 },
    trustRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
    ring: { width: 84, height: 84, borderRadius: 42, borderWidth: 5, alignItems: 'center', justifyContent: 'center' },
    ringScore: { fontSize: 26, fontWeight: '900' },
    ringOf: { fontSize: 10, color: Colors.textMuted },
    trustTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
    cardSub: { fontSize: 12.5, color: Colors.textMuted, lineHeight: 17, marginTop: 3, marginBottom: 8 },
    trustItem: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 24 },
    trustLabel: { flex: 1, fontSize: 12.5, color: Colors.textMuted },
    trustVal: { fontSize: 12.5, fontWeight: '700', color: Colors.text },

    statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 12 },
    statCard: { flex: 1, minHeight: 84, backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 10 },
    statValue: { fontSize: 18, fontWeight: '800', color: Colors.text },
    statLabel: { fontSize: 11.5, color: Colors.textMuted },

    tabs: { flexDirection: 'row', marginHorizontal: 16, marginTop: 14, backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 4 },
    tab: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: PRIMARY },
    tabText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
    tabTextActive: { color: '#FFFFFF', fontWeight: '700' },
    tabContent: { paddingHorizontal: 16, marginTop: 12 },

    emptyBox: { alignItems: 'center', gap: 8, backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 24 },
    emptyText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },

    listingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 10, marginBottom: 8 },
    thumb: { width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.cardAlt },
    thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
    price: { fontSize: 13, fontWeight: '800', color: Colors.accent, marginTop: 1 },

    ratingCard: { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 14, marginBottom: 8, gap: 4 },
    ratingTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    ratingHandle: { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.accent },
    ratingComment: { fontSize: 13.5, color: Colors.text, lineHeight: 19, marginTop: 2 },

    badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
    badgeCard: { width: '31.5%', backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', padding: 10, gap: 4 },
    badgeIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
    badgeLabel: { fontSize: 11.5, fontWeight: '800', color: Colors.text, textAlign: 'center' },
    badgeHow: { fontSize: 10.5, color: Colors.textMuted, textAlign: 'center', lineHeight: 14 },

    section: { paddingHorizontal: 16, marginTop: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 10 },
    settingsCard: { backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, paddingHorizontal: 14, paddingVertical: 10 },
    rowIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    rowLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },
    rowSub: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
    divider: { height: 1, backgroundColor: Colors.border, marginLeft: 62 },
    logoutBtn: { marginTop: 12, minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, backgroundColor: Colors.danger + '1F', borderWidth: 1, borderColor: Colors.danger + '55' },
    logoutText: { color: Colors.danger, fontWeight: '800', fontSize: 14 },

    stateWrap: { alignItems: 'center', marginTop: 60, paddingHorizontal: 24, gap: 6 },
    stateTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 6 },
    stateSub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
    stateBtn: { marginTop: 10, minHeight: 44, borderRadius: 22, backgroundColor: PRIMARY, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' },
    stateBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    linkRow: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 8 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    modalCard: { backgroundColor: Colors.card, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, padding: 22, width: '86%' },
    modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
    modalInput: { backgroundColor: Colors.bg, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 14, color: Colors.text, fontSize: 15, marginBottom: 16 },
    modalCancel: { flex: 1, minHeight: 48, borderRadius: 12, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
    modalSave: { flex: 1, minHeight: 48, borderRadius: 12, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center' },
  });