import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Switch, Alert, Image,
  TextInput, Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme, useColors } from '../../theme/ThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = 'https://campus-backend-production-2dbb.up.railway.app';

interface UserProfile {
  id: string;
  anonymousHandle: string;
  college: string;
  department: string;
  year: number;
  verified: boolean;
  trustScore: number;
  joinedAt: string;
  studentName?: string;
  profilePic?: string;
  stats: {
    listingsPosted: number;
    successfulSales: number;
    buzzPosts: number;
    sosResponses: number;
    ratingsReceived: number;
    avgRating: number;
  };
  badges: Badge[];
  recentListings: ListingPreview[];
  recentRatings: Rating[];
}

interface Badge {
  id: string; icon: string; label: string; description: string; earned: boolean; color: string;
}
interface ListingPreview {
  id: string; title: string; price: number; status: 'active' | 'sold' | 'expired'; image: string;
}
interface Rating {
  id: string; fromHandle: string; score: number; comment: string; listingTitle: string; createdAt: string;
}

const MOCK_PROFILE: UserProfile = {
  id: 'u1', anonymousHandle: 'CampusOwl#42', college: 'IIT Kharagpur',
  department: 'Computer Science', year: 3, verified: true, trustScore: 78,
  joinedAt: '2024-08-01T00:00:00.000Z',
  stats: { listingsPosted: 8, successfulSales: 5, buzzPosts: 23, sosResponses: 2, ratingsReceived: 5, avgRating: 4.4 },
  badges: [
    { id: 'b1', icon: '✓', label: 'Verified Student', description: 'College email verified', earned: true, color: '#3DDC84' },
    { id: 'b2', icon: '🛍️', label: 'First Sale', description: 'Completed first transaction', earned: true, color: '#5B8DEF' },
    { id: 'b3', icon: '⚡', label: 'Buzz Star', description: 'Posted 20+ times on Buzz', earned: true, color: '#FFB347' },
    { id: 'b4', icon: '🚨', label: 'First Responder', description: 'Responded to 2+ SOS alerts', earned: true, color: '#FF6B6B' },
    { id: 'b5', icon: '🏆', label: 'Top Seller', description: 'Complete 10 sales', earned: false, color: '#9398AB' },
    { id: 'b6', icon: '🌟', label: 'Trust Legend', description: 'Reach trust score 90+', earned: false, color: '#9398AB' },
  ],
  recentListings: [
    { id: 'l1', title: 'Engineering Maths Vol 3', price: 299, status: 'sold', image: '' },
    { id: 'l2', title: 'Dell XPS Charger', price: 850, status: 'active', image: '' },
    { id: 'l3', title: 'Python Crash Course', price: 180, status: 'active', image: '' },
  ],
  recentRatings: [
    { id: 'r1', fromHandle: 'NightOwl#77', score: 5, comment: 'Super smooth transaction!', listingTitle: 'Engineering Maths Vol 3', createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 'r2', fromHandle: 'GhostCoder#99', score: 4, comment: 'Good seller, slight delay but all good.', listingTitle: 'Python Crash Course', createdAt: new Date(Date.now() - 432000000).toISOString() },
  ],
};

const softShadow = {
  shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
};
const cardShadow = {
  shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.18, shadowRadius: 10, elevation: 5,
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d < 1) return 'today';
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
};

const getTrustLabel = (score: number, C: any) => {
  if (score >= 90) return { label: 'Legend', color: '#FFD700' };
  if (score >= 75) return { label: 'Trusted', color: C.success };
  if (score >= 50) return { label: 'Good', color: C.accent };
  if (score >= 25) return { label: 'New', color: C.warn };
  return { label: 'Unrated', color: C.textDim };
};

const stars = (score: number) =>
  Array.from({ length: 5 }, (_, i) => i < Math.round(score) ? '★' : '☆').join('');

// Compact trust ring — smaller, no double ring
const TrustRing = ({ score }: { score: number }) => {
  const Colors = useColors();
  const { label, color } = getTrustLabel(score, Colors);
  const tr = StyleSheet.create({
    wrap: { alignItems: 'center', gap: 6 },
    ring: { width: 88, height: 88, borderRadius: 44, borderWidth: 4, borderColor: color, alignItems: 'center', justifyContent: 'center', backgroundColor: color + '12' },
    score: { fontSize: 26, fontWeight: '900', color },
    outOf: { fontSize: 10, color: Colors.textMuted },
    labelWrap: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 3, backgroundColor: color + '22' },
    labelText: { fontSize: 11, fontWeight: '800', color },
  });
  return (
    <View style={tr.wrap}>
      <View style={tr.ring}>
        <Text style={tr.score}>{score}</Text>
        <Text style={tr.outOf}>/100</Text>
      </View>
      <View style={tr.labelWrap}>
        <Text style={tr.labelText}>{label}</Text>
      </View>
    </View>
  );
};

// Compact badge — shadow, no border
const BadgeCard = ({ badge }: { badge: Badge }) => {
  const Colors = useColors();
  const bc = StyleSheet.create({
    card: { width: '30%', backgroundColor: Colors.card, borderRadius: 14, alignItems: 'center', padding: 10, gap: 4, ...softShadow, opacity: badge.earned ? 1 : 0.45 },
    iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    icon: { fontSize: 19 },
    label: { fontSize: 11, fontWeight: '800', color: badge.earned ? Colors.text : Colors.textDim, textAlign: 'center' },
    desc: { fontSize: 9, color: Colors.textDim, textAlign: 'center', lineHeight: 13 },
    lock: { fontSize: 10 },
  });
  return (
    <View style={bc.card}>
      <View style={[bc.iconWrap, { backgroundColor: badge.color + (badge.earned ? '22' : '11') }]}>
        <Text style={[bc.icon, { opacity: badge.earned ? 1 : 0.4 }]}>{badge.icon}</Text>
      </View>
      <Text style={bc.label}>{badge.label}</Text>
      <Text style={bc.desc} numberOfLines={2}>{badge.description}</Text>
      {!badge.earned && <Text style={bc.lock}>🔒</Text>}
    </View>
  );
};

// Compact rating card — shadow, no border
const RatingCard = ({ rating }: { rating: Rating }) => {
  const Colors = useColors();
  const rc = StyleSheet.create({
    card: { backgroundColor: Colors.card, borderRadius: 14, padding: 13, marginBottom: 9, ...softShadow },
    header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
    handle: { fontWeight: '700', fontSize: 12.5, color: Colors.accent, flex: 1 },
    stars: { fontSize: 12, color: Colors.warn },
    time: { fontSize: 10, color: Colors.textDim },
    listing: { fontSize: 11, color: Colors.textMuted, marginBottom: 5 },
    comment: { fontSize: 13, color: Colors.text, lineHeight: 18 },
  });
  return (
    <View style={rc.card}>
      <View style={rc.header}>
        <Text style={rc.handle}>{rating.fromHandle}</Text>
        <Text style={rc.stars}>{stars(rating.score)}</Text>
        <Text style={rc.time}>{timeAgo(rating.createdAt)}</Text>
      </View>
      <Text style={rc.listing}>Re: {rating.listingTitle}</Text>
      <Text style={rc.comment}>{rating.comment}</Text>
    </View>
  );
};

// Listing row — dot separator instead of bottom border line
const ListingRow = ({ listing }: { listing: ListingPreview }) => {
  const Colors = useColors();
  const statusColor = listing.status === 'sold' ? Colors.success : listing.status === 'active' ? Colors.accent : Colors.textDim;
  const lr = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
    thumb: { width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', ...softShadow },
    info: { flex: 1 },
    title: { fontWeight: '700', fontSize: 13, color: Colors.text },
    price: { fontSize: 12, color: Colors.accent, fontWeight: '700', marginTop: 1 },
    statusBadge: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4, backgroundColor: statusColor + '22' },
    statusText: { fontSize: 11, fontWeight: '700', color: statusColor },
  });
  return (
    <View style={lr.row}>
      <View style={lr.thumb}><Text style={{ fontSize: 18 }}>📦</Text></View>
      <View style={lr.info}>
        <Text style={lr.title} numberOfLines={1}>{listing.title}</Text>
        <Text style={lr.price}>₹{listing.price}</Text>
      </View>
      <View style={lr.statusBadge}>
        <Text style={lr.statusText}>{listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}</Text>
      </View>
    </View>
  );
};

const SettingsSection = ({ onLogout, onCollegeAccess }: { onLogout: () => void; onCollegeAccess: () => void }) => {
  const Colors = useColors();
  const { isDark, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [anonymousMode, setAnonymousMode] = useState(true);

  const ss = StyleSheet.create({
    wrap: { paddingHorizontal: 16, marginBottom: 20 },
    title: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 10 },
    card: { backgroundColor: Colors.card, borderRadius: 16, overflow: 'hidden', ...softShadow },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13 },
    rowLabel: { fontSize: 14, color: Colors.text, fontWeight: '600' },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginHorizontal: 16 },
    collegeAccessBtn: { marginTop: 10, backgroundColor: Colors.accent + '18', borderRadius: 14, paddingVertical: 13, alignItems: 'center', ...softShadow },
    collegeAccessText: { color: Colors.accent, fontWeight: '800', fontSize: 14 },
    logoutBtn: { marginTop: 10, backgroundColor: Colors.danger + '18', borderRadius: 14, paddingVertical: 13, alignItems: 'center', ...softShadow },
    logoutText: { color: Colors.danger, fontWeight: '800', fontSize: 14 },
  });

  const Row = ({ label, value, onToggle }: { label: string; value: boolean; onToggle: (v: boolean) => void }) => (
    <View style={ss.row}>
      <Text style={ss.rowLabel}>{label}</Text>
      <Switch value={value} onValueChange={onToggle} trackColor={{ false: Colors.border, true: Colors.accent + '88' }} thumbColor={value ? Colors.accent : Colors.textDim} />
    </View>
  );

  return (
    <View style={ss.wrap}>
      <Text style={ss.title}>Settings</Text>
      <View style={ss.card}>
        <Row label="Push Notifications" value={notifications} onToggle={setNotifications} />
        <View style={ss.divider} />
        <Row label="Dark Mode" value={isDark} onToggle={toggleTheme} />
        <View style={ss.divider} />
        <Row label="Anonymous Mode on Buzz" value={anonymousMode} onToggle={setAnonymousMode} />
      </View>
      <TouchableOpacity style={ss.collegeAccessBtn} onPress={onCollegeAccess}>
        <Text style={ss.collegeAccessText}>🏫 Cross-College Access</Text>
      </TouchableOpacity>
      <TouchableOpacity style={ss.logoutBtn} onPress={onLogout}>
        <Text style={ss.logoutText}>🚪 Log Out</Text>
      </TouchableOpacity>
    </View>
  );
};

export const ProfileScreen = () => {
  const Colors = useColors();
  const navigation = useNavigation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'listings' | 'ratings' | 'badges'>('listings');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [editNameModal, setEditNameModal] = useState(false);
  const [editNameText, setEditNameText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll: { paddingBottom: 40 },

    // Header — tighter, no bottom border, uses hairline divider
    profileHeader: { flexDirection: 'row', gap: 12, padding: 14, paddingBottom: 16 },
    bellBtn: { position: 'absolute', top: 14, right: 14, width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', zIndex: 10, ...softShadow },
    bellIcon: { fontSize: 15 },
    bellBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: Colors.danger, borderRadius: 8, minWidth: 15, height: 15, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
    bellBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
    avatarWrap: { position: 'relative' },
    avatarImage: { width: 64, height: 64, borderRadius: 20 },
    avatar: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 22, fontWeight: '900', color: '#fff' },
    avatarEditBadge: { position: 'absolute', bottom: -2, right: -2, backgroundColor: Colors.card, borderRadius: 9, width: 18, height: 18, alignItems: 'center', justifyContent: 'center', ...softShadow },
    profileInfo: { flex: 1, justifyContent: 'center', gap: 2 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
    handle: { fontSize: 17, fontWeight: '900', color: Colors.text },
    editNameBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    realName: { fontSize: 12.5, color: Colors.textMuted, fontWeight: '600' },
    editNameIcon: { fontSize: 10 },
    verifiedBadge: { backgroundColor: Colors.success + '22', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
    verifiedText: { fontSize: 10, fontWeight: '700', color: Colors.success },
    college: { fontSize: 12.5, color: Colors.accent, fontWeight: '700' },
    dept: { fontSize: 11.5, color: Colors.textMuted },
    joined: { fontSize: 10.5, color: Colors.textDim },
    dividerLine: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginHorizontal: 16, marginBottom: 10 },

    // Trust card — shadow, no border
    trustCard: { flexDirection: 'row', gap: 14, alignItems: 'center', marginHorizontal: 16, marginBottom: 12, padding: 16, backgroundColor: Colors.card, borderRadius: 18, ...cardShadow },
    trustInfo: { flex: 1 },
    trustTitle: { fontWeight: '800', fontSize: 14, color: Colors.text, marginBottom: 3 },
    trustDesc: { fontSize: 11, color: Colors.textMuted, lineHeight: 15, marginBottom: 8 },
    trustBreakdown: { gap: 5 },
    trustItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    trustItemDot: { fontSize: 11, fontWeight: '800', width: 14 },
    trustItemLabel: { fontSize: 11, color: Colors.textMuted, flex: 1 },
    trustItemVal: { fontSize: 11, fontWeight: '700', color: Colors.text },

    // Compact stat cards — 4 in a row, shadow, no border
    statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 10 },
    statCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 14, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, gap: 2, ...softShadow },
    statIcon: { fontSize: 17 },
    statValue: { fontSize: 17, fontWeight: '900', color: Colors.text },
    statLabel: { fontSize: 9.5, color: Colors.textMuted, textAlign: 'center' },

    // Rating bar — shadow, no border
    ratingBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 12, backgroundColor: Colors.card, borderRadius: 14, padding: 11, ...softShadow },
    ratingBarLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '600', flex: 1 },
    ratingBarStars: { fontSize: 13, color: Colors.warn },
    ratingBarVal: { fontSize: 11.5, color: Colors.text, fontWeight: '700' },

    // Tabs — shadow, no border
    tabs: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: Colors.card, borderRadius: 14, padding: 4, ...softShadow },
    tab: { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: Colors.accent },
    tabText: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
    tabTextActive: { color: '#fff' },
    tabContent: { paddingHorizontal: 16, marginBottom: 20 },
    badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-start' },
    empty: { textAlign: 'center', color: Colors.textMuted, paddingVertical: 30, fontSize: 13 },

    // Edit name modal — shadow, no border
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
    modalCard: { backgroundColor: Colors.card, borderRadius: 20, padding: 24, width: '85%', ...cardShadow },
    modalTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: 14 },
    modalInput: { backgroundColor: Colors.bg, borderRadius: 12, padding: 13, color: Colors.text, fontSize: 15, marginBottom: 14 },
    modalBtns: { flexDirection: 'row', gap: 12 },
    modalCancel: { flex: 1, backgroundColor: Colors.bg, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    modalCancelText: { color: Colors.text, fontWeight: '700' },
    modalSave: { flex: 1, backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    modalSaveText: { color: '#fff', fontWeight: '800' },
  });

  useEffect(() => {
    const load = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('token');
        const savedPic = await AsyncStorage.getItem('profilePic');
        if (savedPic) setProfilePic(savedPic);
        if (token) {
          const response = await fetch(`${API_URL}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } });
          if (response.ok) {
            const data = await response.json();
            setProfile({
              ...MOCK_PROFILE,
              id: data.id,
              anonymousHandle: data.anonymous_handle,
              college: data.college,
              department: data.department,
              verified: data.verified,
              trustScore: data.trust_score || 0,
              joinedAt: data.created_at,
              studentName: data.student_name || '',
              stats: {
                listingsPosted: parseInt(data.listings_count) || 0,
                successfulSales: parseInt(data.sales_count) || 0,
                buzzPosts: parseInt(data.buzz_count) || 0,
                sosResponses: 0,
                ratingsReceived: parseInt(data.ratings_count) || 0,
                avgRating: parseFloat(data.avg_rating) || 0,
              },
              recentListings: data.recentListings || [],
              recentRatings: data.recentRatings?.map((r: any) => ({
                id: r.id || Date.now().toString(),
                fromHandle: r.from_handle,
                score: r.score,
                comment: r.comment,
                listingTitle: r.listing_title,
                createdAt: r.created_at,
              })) || [],
            });
            setEditNameText(data.student_name || '');
            return;
          }
        }
        if (userStr) {
          const user = JSON.parse(userStr);
          setEditNameText(user.student_name || '');
          setProfile({
            ...MOCK_PROFILE,
            id: user.id,
            anonymousHandle: user.anonymous_handle || MOCK_PROFILE.anonymousHandle,
            college: user.college || MOCK_PROFILE.college,
            department: user.department || MOCK_PROFILE.department,
            studentName: user.student_name || '',
            verified: user.verified || false,
          });
        }
      } catch (e) {
        setProfile(MOCK_PROFILE);
      } finally {
        setLoading(false);
      }
    };
    load();

    const loadUnread = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await response.json();
        if (response.ok) setUnreadCount(data.unreadCount || 0);
      } catch (e) {}
    };
    loadUnread();
  }, []);

  const handlePickProfilePic = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow access to your photo library.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7 });
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setProfilePic(uri);
        await AsyncStorage.setItem('profilePic', uri);
      }
    } catch (err) { Alert.alert('Error', 'Failed to pick image.'); }
  };

  const handleSaveName = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.student_name = editNameText;
        await AsyncStorage.setItem('user', JSON.stringify(user));
        setProfile(prev => prev ? { ...prev, studentName: editNameText } : prev);
      }
      setEditNameModal(false);
    } catch (e) { Alert.alert('Error', 'Failed to save name.'); }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('profilePic');
        navigation.reset({ index: 0, routes: [{ name: 'Login' as never }] });
      }},
    ]);
  };

  if (loading) return <SafeAreaView style={styles.container}><ActivityIndicator color={Colors.accent} style={{ marginTop: 80 }} /></SafeAreaView>;
  if (!profile) return null;

  const { stats, badges, recentListings, recentRatings } = profile;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Profile header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('Notifications' as never)}>
            <Text style={styles.bellIcon}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePickProfilePic} style={styles.avatarWrap}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.avatarImage} />
            ) : (
              <LinearGradient colors={[Colors.accent, Colors.accentAlt]} style={styles.avatar}>
                <Text style={styles.avatarText}>{profile.anonymousHandle.slice(0, 2).toUpperCase()}</Text>
              </LinearGradient>
            )}
            <View style={styles.avatarEditBadge}><Text style={{ fontSize: 9 }}>📷</Text></View>
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.handle}>{profile.anonymousHandle}</Text>
              {profile.verified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓ Verified</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => setEditNameModal(true)} style={styles.editNameBtn}>
              <Text style={styles.realName}>{profile.studentName || '✏️ Add your name'}</Text>
              <Text style={styles.editNameIcon}>✏️</Text>
            </TouchableOpacity>
            <Text style={styles.college}>{profile.college}</Text>
            <Text style={styles.dept}>{profile.department} • Year {profile.year}</Text>
            <Text style={styles.joined}>
              Member since {new Date(profile.joinedAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </Text>
          </View>
        </View>

        <View style={styles.dividerLine} />

        {/* Trust score */}
        <View style={styles.trustCard}>
          <TrustRing score={profile.trustScore} />
          <View style={styles.trustInfo}>
            <Text style={styles.trustTitle}>Trust Score</Text>
            <Text style={styles.trustDesc}>Based on sales, ratings, activity, and SOS responses.</Text>
            <View style={styles.trustBreakdown}>
              {[
                { label: 'Sales', val: `${stats.successfulSales}/10`, done: stats.successfulSales >= 10 },
                { label: 'Avg Rating', val: `${stats.avgRating}★`, done: stats.avgRating >= 4 },
                { label: 'Verified', val: profile.verified ? 'Yes' : 'No', done: profile.verified },
              ].map(item => (
                <View key={item.label} style={styles.trustItem}>
                  <Text style={[styles.trustItemDot, { color: item.done ? Colors.success : Colors.textDim }]}>{item.done ? '✓' : '○'}</Text>
                  <Text style={styles.trustItemLabel}>{item.label}</Text>
                  <Text style={styles.trustItemVal}>{item.val}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Compact stats row */}
        <View style={styles.statsRow}>
          {[
            { icon: '🛍️', value: stats.listingsPosted, label: 'Listed', tab: 'listings' },
            { icon: '✅', value: stats.successfulSales, label: 'Sold', tab: 'listings' },
            { icon: '⚡', value: stats.buzzPosts, label: 'Posts', tab: 'badges' },
            { icon: '🚨', value: stats.sosResponses, label: 'SOS', tab: 'badges' },
          ].map(stat => (
            <TouchableOpacity key={stat.label} style={styles.statCard} onPress={() => setActiveTab(stat.tab as any)} activeOpacity={0.7}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Rating bar */}
        <TouchableOpacity style={styles.ratingBar} onPress={() => setActiveTab('ratings')} activeOpacity={0.7}>
          <Text style={styles.ratingBarLabel}>Avg Rating</Text>
          <Text style={styles.ratingBarStars}>{stars(stats.avgRating)}</Text>
          <Text style={styles.ratingBarVal}>{stats.avgRating} ({stats.ratingsReceived})</Text>
        </TouchableOpacity>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['listings', 'ratings', 'badges'] as const).map(tab => (
            <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tabContent}>
          {activeTab === 'listings' && (
            <>
              {recentListings.map(l => <ListingRow key={l.id} listing={l} />)}
              {recentListings.length === 0 && <Text style={styles.empty}>No listings yet. Start selling! 🛍️</Text>}
            </>
          )}
          {activeTab === 'ratings' && (
            <>
              {recentRatings.map(r => <RatingCard key={r.id} rating={r} />)}
              {recentRatings.length === 0 && <Text style={styles.empty}>No ratings yet. Complete a sale to get rated!</Text>}
            </>
          )}
          {activeTab === 'badges' && (
            <View style={styles.badgesGrid}>
              {badges.map(b => <BadgeCard key={b.id} badge={b} />)}
            </View>
          )}
        </View>

        <SettingsSection onLogout={handleLogout} onCollegeAccess={() => navigation.navigate('CollegeAccess' as never)} />
      </ScrollView>

      <Modal visible={editNameModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit your name</Text>
            <TextInput style={styles.modalInput} value={editNameText} onChangeText={setEditNameText} placeholder="Your real name" placeholderTextColor={Colors.textDim} autoFocus />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setEditNameModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSaveName}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};