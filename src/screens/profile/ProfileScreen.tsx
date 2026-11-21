import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image, RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../../theme/ThemeProvider';
import { thumb } from '../../utils/img';
import { confirmLogout } from '../../utils/session';
import { ProfileHero, HeroButton, HeroPill } from './ProfileExtras';

const API_URL = 'https://campus-backend-arfy.onrender.com';
const PRIMARY = '#2F54EB';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface ListingPreview { id: string; title: string; price: number | string; status: string; images?: string[]; }
interface RatingItem { score: number; comment: string; created_at: string; from_handle: string; listing_title: string; }
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
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [studentName, setStudentName] = useState('');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'listings' | 'ratings' | 'badges'>('listings');
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const [token, userStr] = await Promise.all([AsyncStorage.getItem('token'), AsyncStorage.getItem('user')]);
      const stored = userStr ? JSON.parse(userStr) : {};
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
        setStudentName(d.student_name || stored.student_name || '');
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
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

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
        <View style={styles.stateWrap}>
          <Ionicons name="cloud-offline-outline" size={34} color={Colors.warn} />
          <Text style={styles.stateTitle}>Could not load your profile</Text>
          <Text style={styles.stateSub}>Check your internet and try again.</Text>
          <TouchableOpacity style={styles.stateBtn} onPress={() => { setLoading(true); load(); }}>
            <Text style={styles.stateBtnText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkRow} onPress={confirmLogout}>
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
  const joined = profile.joinedAt
    ? new Date(profile.joinedAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '';

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); setRefreshKey((k) => k + 1); load(); }}
            tintColor={Colors.accent}
            progressViewOffset={insets.top}
          />
        }
      >
        <ProfileHero
          userId="me"
          handle={profile.handle}
          name={studentName}
          showHandle
          college={profile.college}
          meta={meta}
          verified={profile.verified}
          joined={joined}
          refreshKey={refreshKey}
          right={
            <>
              <HeroButton onPress={() => navigation.navigate('Notifications')} label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'} badge={unreadCount}>
                <Ionicons name="notifications-outline" size={21} color="#fff" />
              </HeroButton>
              <HeroButton onPress={() => navigation.navigate('Settings')} label="Settings and activity">
                <Ionicons name="menu" size={24} color="#fff" />
              </HeroButton>
            </>
          }
          actions={
            <>
              <HeroPill icon="create-outline" label="Edit profile" onPress={() => navigation.navigate('Settings')} />
              <HeroPill icon="chatbubble-ellipses-outline" label="Messages" onPress={() => navigation.navigate('DirectChats')} />
            </>
          }
          extraStats={[
            { label: 'Listed', value: profile.listings },
            { label: 'Trust', value: profile.trustScore },
          ]}
        />

        {!studentName ? (
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Add your name"
            style={{ marginHorizontal: 16, marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, backgroundColor: Colors.accent + '1F' }}
          >
            <Ionicons name="person-circle-outline" size={22} color={Colors.accent} />
            <Text style={{ flex: 1, color: Colors.text, fontSize: 12.5, lineHeight: 18 }}>Add your name so your classmates can recognise you. Until then you show up as "Student".</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : null}

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
                  <Ionicons name={item.done ? 'checkmark-circle' : 'ellipse-outline'} size={15} color={item.done ? Colors.success : Colors.textDim} />
                  <Text style={styles.trustLabel}>{item.label}</Text>
                  <Text style={styles.trustVal}>{item.val}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {([
            { key: 'listings', label: 'Listings' },
            { key: 'ratings', label: 'Ratings' },
            { key: 'badges', label: `Badges ${earned}/${badges.length}` },
          ] as const).map((t) => (
            <TouchableOpacity key={t.key} style={[styles.tab, activeTab === t.key && styles.tabActive]} onPress={() => setActiveTab(t.key)} accessibilityRole="button">
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
                <TouchableOpacity style={styles.stateBtn} onPress={() => navigation.navigate('Marketplace', { screen: 'CreateListing' })}>
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
                      <Image source={{ uri: thumb(img, 120) }} style={styles.thumb} />
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
      </ScrollView>
    </View>
  );
};

const makeStyles = (Colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    meta: { fontSize: 12, color: Colors.textMuted },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    chipText: { fontSize: 11, fontWeight: '700' },

    card: { marginHorizontal: 16, marginTop: 14, backgroundColor: Colors.card, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16 },
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
    rowLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },
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

    stateWrap: { alignItems: 'center', marginTop: 60, paddingHorizontal: 24, gap: 6 },
    stateTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 6 },
    stateSub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
    stateBtn: { marginTop: 10, minHeight: 44, borderRadius: 22, backgroundColor: PRIMARY, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' },
    stateBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    linkRow: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  });
// END OF FILE