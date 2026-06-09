import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Switch, Alert, Image,
  TextInput, Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../theme/colors';

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
  id: string;
  icon: string;
  label: string;
  description: string;
  earned: boolean;
  color: string;
}

interface ListingPreview {
  id: string;
  title: string;
  price: number;
  status: 'active' | 'sold' | 'expired';
  image: string;
}

interface Rating {
  id: string;
  fromHandle: string;
  score: number;
  comment: string;
  listingTitle: string;
  createdAt: string;
}

const MOCK_PROFILE: UserProfile = {
  id: 'u1',
  anonymousHandle: 'CampusOwl#42',
  college: 'IIT Kharagpur',
  department: 'Computer Science',
  year: 3,
  verified: true,
  trustScore: 78,
  joinedAt: '2024-08-01T00:00:00.000Z',
  stats: {
    listingsPosted: 8,
    successfulSales: 5,
    buzzPosts: 23,
    sosResponses: 2,
    ratingsReceived: 5,
    avgRating: 4.4,
  },
  badges: [
    { id: 'b1', icon: '✓', label: 'Verified Student', description: 'College email verified', earned: true, color: Colors.success },
    { id: 'b2', icon: '🛍️', label: 'First Sale', description: 'Completed first transaction', earned: true, color: Colors.accent },
    { id: 'b3', icon: '⚡', label: 'Buzz Star', description: 'Posted 20+ times on Buzz', earned: true, color: '#FFB347' },
    { id: 'b4', icon: '🚨', label: 'First Responder', description: 'Responded to 2+ SOS alerts', earned: true, color: Colors.danger },
    { id: 'b5', icon: '🏆', label: 'Top Seller', description: 'Complete 10 sales', earned: false, color: Colors.textDim },
    { id: 'b6', icon: '🌟', label: 'Trust Legend', description: 'Reach trust score 90+', earned: false, color: Colors.textDim },
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

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d < 1) return 'today';
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
};

const trustLabel = (score: number) => {
  if (score >= 90) return { label: 'Legend', color: '#FFD700' };
  if (score >= 75) return { label: 'Trusted', color: Colors.success };
  if (score >= 50) return { label: 'Good', color: Colors.accent };
  if (score >= 25) return { label: 'New', color: Colors.warn };
  return { label: 'Unrated', color: Colors.textDim };
};

const stars = (score: number) =>
  Array.from({ length: 5 }, (_, i) => i < Math.round(score) ? '★' : '☆').join('');

const TrustRing = ({ score }: { score: number }) => {
  const { label, color } = trustLabel(score);
  return (
    <View style={tr.wrap}>
      <View style={[tr.outerRing, { borderColor: color + '33' }]}>
        <View style={[tr.innerRing, { borderColor: color }]}>
          <Text style={[tr.score, { color }]}>{score}</Text>
          <Text style={tr.outOf}>/100</Text>
        </View>
      </View>
      <View style={[tr.labelWrap, { backgroundColor: color + '22', borderColor: color + '55' }]}>
        <Text style={[tr.label, { color }]}>{label}</Text>
      </View>
    </View>
  );
};

const tr = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 10 },
  outerRing: { width: 110, height: 110, borderRadius: 55, borderWidth: 6, alignItems: 'center', justifyContent: 'center' },
  innerRing: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  score: { fontSize: 28, fontWeight: '900' },
  outOf: { fontSize: 11, color: Colors.textMuted },
  labelWrap: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 4 },
  label: { fontSize: 12, fontWeight: '800' },
});

const BadgeCard = ({ badge }: { badge: Badge }) => (
  <View style={[bc.card, !badge.earned && bc.cardLocked]}>
    <View style={[bc.iconWrap, { backgroundColor: badge.color + (badge.earned ? '22' : '11') }]}>
      <Text style={[bc.icon, { opacity: badge.earned ? 1 : 0.3 }]}>{badge.icon}</Text>
    </View>
    <Text style={[bc.label, !badge.earned && bc.labelLocked]}>{badge.label}</Text>
    <Text style={bc.desc} numberOfLines={2}>{badge.description}</Text>
    {!badge.earned && <Text style={bc.lock}>🔒</Text>}
  </View>
);

const bc = StyleSheet.create({
  card: { width: '30%', backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', padding: 10, gap: 4 },
  cardLocked: { borderColor: Colors.border, opacity: 0.5 },
  iconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 20 },
  label: { fontSize: 11, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  labelLocked: { color: Colors.textDim },
  desc: { fontSize: 9, color: Colors.textDim, textAlign: 'center', lineHeight: 13 },
  lock: { fontSize: 10 },
});

const RatingCard = ({ rating }: { rating: Rating }) => (
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

const rc = StyleSheet.create({
  card: { backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 14, marginBottom: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  handle: { fontWeight: '700', fontSize: 13, color: Colors.accent, flex: 1 },
  stars: { fontSize: 13, color: Colors.warn },
  time: { fontSize: 10, color: Colors.textDim },
  listing: { fontSize: 11, color: Colors.textMuted, marginBottom: 6 },
  comment: { fontSize: 13, color: Colors.text, lineHeight: 19 },
});

const ListingRow = ({ listing }: { listing: ListingPreview }) => {
  const statusColor = listing.status === 'sold' ? Colors.success : listing.status === 'active' ? Colors.accent : Colors.textDim;
  return (
    <View style={lr.row}>
      <View style={lr.thumb}><Text style={{ fontSize: 20 }}>📦</Text></View>
      <View style={lr.info}>
        <Text style={lr.title} numberOfLines={1}>{listing.title}</Text>
        <Text style={lr.price}>₹{listing.price}</Text>
      </View>
      <View style={[lr.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor + '55' }]}>
        <Text style={[lr.statusText, { color: statusColor }]}>{listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}</Text>
      </View>
    </View>
  );
};

const lr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  thumb: { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  title: { fontWeight: '700', fontSize: 13, color: Colors.text },
  price: { fontSize: 12, color: Colors.accent, fontWeight: '700', marginTop: 2 },
  statusBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
});

const SettingsSection = ({ onLogout }: { onLogout: () => void }) => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [anonymousMode, setAnonymousMode] = useState(true);

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
        <Row label="Dark Mode" value={darkMode} onToggle={setDarkMode} />
        <View style={ss.divider} />
        <Row label="Anonymous Mode on Buzz" value={anonymousMode} onToggle={setAnonymousMode} />
      </View>
      <TouchableOpacity style={ss.logoutBtn} onPress={onLogout}>
        <Text style={ss.logoutText}>🚪 Log Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const ss = StyleSheet.create({
  wrap: { paddingHorizontal: 16, marginBottom: 20 },
  title: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  card: { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  rowLabel: { fontSize: 14, color: Colors.text, fontWeight: '600' },
  divider: { height: 1, backgroundColor: Colors.border },
  logoutBtn: { marginTop: 12, backgroundColor: Colors.danger + '18', borderRadius: 12, borderWidth: 1, borderColor: Colors.danger + '44', paddingVertical: 13, alignItems: 'center' },
  logoutText: { color: Colors.danger, fontWeight: '800', fontSize: 14 },
});

export const ProfileScreen = () => {
  const navigation = useNavigation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'listings' | 'ratings' | 'badges'>('listings');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [editNameModal, setEditNameModal] = useState(false);
  const [editNameText, setEditNameText] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        const savedPic = await AsyncStorage.getItem('profilePic');
        if (savedPic) setProfilePic(savedPic);
        if (userStr) {
          const user = JSON.parse(userStr);
          const studentName = user.student_name || '';
          setEditNameText(studentName);
          setProfile({
            ...MOCK_PROFILE,
            id: user.id,
            anonymousHandle: user.anonymous_handle || MOCK_PROFILE.anonymousHandle,
            college: user.college || MOCK_PROFILE.college,
            department: user.department || MOCK_PROFILE.department,
            studentName,
            verified: user.verified || false,
          });
        } else {
          setProfile(MOCK_PROFILE);
        }
      } catch (e) {
        setProfile(MOCK_PROFILE);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handlePickProfilePic = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photo library.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setProfilePic(uri);
        await AsyncStorage.setItem('profilePic', uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image.');
    }
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
    } catch (e) {
      Alert.alert('Error', 'Failed to save name.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive', onPress: async () => {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
          await AsyncStorage.removeItem('profilePic');
          navigation.reset({ index: 0, routes: [{ name: 'Login' as never }] });
        }
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={Colors.accent} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  if (!profile) return null;

  const { stats, badges, recentListings, recentRatings } = profile;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={handlePickProfilePic} style={styles.avatarWrap}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {profile.anonymousHandle.slice(0, 2).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Text style={{ fontSize: 10 }}>📷</Text>
            </View>
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

            {/* Editable name */}
            <TouchableOpacity onPress={() => setEditNameModal(true)} style={styles.editNameBtn}>
              <Text style={styles.realName}>
                {profile.studentName || '✏️ Add your name'}
              </Text>
              <Text style={styles.editNameIcon}>✏️</Text>
            </TouchableOpacity>

            <Text style={styles.college}>{profile.college}</Text>
            <Text style={styles.dept}>{profile.department} • Year {profile.year}</Text>
            <Text style={styles.joined}>
              Member since {new Date(profile.joinedAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </Text>
          </View>
        </View>

        {/* Trust Score */}
        <View style={styles.trustCard}>
          <TrustRing score={profile.trustScore} />
          <View style={styles.trustInfo}>
            <Text style={styles.trustTitle}>Trust Score</Text>
            <Text style={styles.trustDesc}>Based on your sales, ratings, activity, and SOS responses.</Text>
            <View style={styles.trustBreakdown}>
              {[
                { label: 'Sales', val: stats.successfulSales + '/10', done: stats.successfulSales >= 10 },
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

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { icon: '🛍️', value: stats.listingsPosted, label: 'Listed', tab: 'listings' },
            { icon: '✅', value: stats.successfulSales, label: 'Sold', tab: 'listings' },
            { icon: '⚡', value: stats.buzzPosts, label: 'Posts', tab: 'badges' },
            { icon: '🚨', value: stats.sosResponses, label: 'Responses', tab: 'badges' },
          ].map(stat => (
            <TouchableOpacity
              key={stat.label}
              style={sc.card}
              onPress={() => setActiveTab(stat.tab as any)}
              activeOpacity={0.7}
            >
              <Text style={sc.icon}>{stat.icon}</Text>
              <Text style={sc.value}>{stat.value}</Text>
              <Text style={sc.label}>{stat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Avg rating */}
        <TouchableOpacity style={styles.ratingBar} onPress={() => setActiveTab('ratings')} activeOpacity={0.7}>
          <Text style={styles.ratingBarLabel}>Average Rating</Text>
          <Text style={styles.ratingBarStars}>{stars(stats.avgRating)}</Text>
          <Text style={styles.ratingBarVal}>{stats.avgRating} ({stats.ratingsReceived} ratings)</Text>
        </TouchableOpacity>

        {/* Tab Switcher */}
        <View style={styles.tabs}>
          {(['listings', 'ratings', 'badges'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
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

        {/* Settings */}
        <SettingsSection onLogout={handleLogout} />

      </ScrollView>

      {/* Edit Name Modal */}
      <Modal visible={editNameModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit your name</Text>
            <TextInput
              style={styles.modalInput}
              value={editNameText}
              onChangeText={setEditNameText}
              placeholder="Your real name"
              placeholderTextColor={Colors.textDim}
              autoFocus
            />
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

const sc = StyleSheet.create({
  card: { flex: 1, backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', padding: 12, gap: 4 },
  icon: { fontSize: 20 },
  value: { fontSize: 18, fontWeight: '900', color: Colors.text },
  label: { fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: 40 },
  profileHeader: { flexDirection: 'row', gap: 14, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  avatarWrap: { position: 'relative' },
  avatarImage: { width: 68, height: 68, borderRadius: 34 },
  avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: '900', color: '#fff' },
  avatarEditBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: Colors.card, borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  profileInfo: { flex: 1, justifyContent: 'center', gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  handle: { fontSize: 18, fontWeight: '900', color: Colors.text },
  editNameBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  realName: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  editNameIcon: { fontSize: 11 },
  verifiedBadge: { backgroundColor: Colors.success + '22', borderRadius: 6, borderWidth: 1, borderColor: Colors.success + '55', paddingHorizontal: 7, paddingVertical: 2 },
  verifiedText: { fontSize: 10, fontWeight: '700', color: Colors.success },
  college: { fontSize: 13, color: Colors.accent, fontWeight: '700' },
  dept: { fontSize: 12, color: Colors.textMuted },
  joined: { fontSize: 11, color: Colors.textDim },
  trustCard: { flexDirection: 'row', gap: 16, alignItems: 'center', margin: 16, padding: 16, backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  trustInfo: { flex: 1 },
  trustTitle: { fontWeight: '800', fontSize: 15, color: Colors.text, marginBottom: 4 },
  trustDesc: { fontSize: 11, color: Colors.textMuted, lineHeight: 16, marginBottom: 10 },
  trustBreakdown: { gap: 5 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trustItemDot: { fontSize: 12, fontWeight: '800', width: 14 },
  trustItemLabel: { fontSize: 11, color: Colors.textMuted, flex: 1 },
  trustItemVal: { fontSize: 11, fontWeight: '700', color: Colors.text },
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  ratingBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 12 },
  ratingBarLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  ratingBarStars: { fontSize: 14, color: Colors.warn },
  ratingBarVal: { fontSize: 12, color: Colors.text, fontWeight: '700' },
  tabs: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 14, backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 9 },
  tabActive: { backgroundColor: Colors.accent },
  tabText: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
  tabTextActive: { color: '#fff' },
  tabContent: { paddingHorizontal: 16, marginBottom: 20 },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-start' },
  empty: { textAlign: 'center', color: Colors.textMuted, paddingVertical: 30, fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: Colors.card, borderRadius: 20, padding: 24, width: '85%', borderWidth: 1, borderColor: Colors.border },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 16 },
  modalInput: { backgroundColor: Colors.bg, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 14, color: Colors.text, fontSize: 16, marginBottom: 16 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  modalCancelText: { color: Colors.text, fontWeight: '700' },
  modalSave: { flex: 1, backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  modalSaveText: { color: '#fff', fontWeight: '800' },
});