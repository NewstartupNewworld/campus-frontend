import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../theme/ThemeProvider';

const API_URL = 'https://campus-backend-arfy.onrender.com';
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const HERO = '#2F54EB';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const apiGet = async (path: string) => {
  const token = await AsyncStorage.getItem('token');
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Request failed');
  return data;
};

export const HomeScreen = () => {
  const Colors = useColors();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const [user, setUser] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [events, setEvents] = useState<any[] | null>(null);
  const [posts, setPosts] = useState<any[] | null>(null);
  const [failed, setFailed] = useState(false);

  const loadAll = useCallback(async () => {
    let college = '';
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        setUser(u);
        college = u?.college || '';
      }
    } catch (e) {}

    const [notif, ev, bz] = await Promise.allSettled([
      apiGet('/api/notifications'),
      apiGet('/api/events?upcoming=true'),
      apiGet('/api/buzz/feed?page=1'),
    ]);

    if (notif.status === 'fulfilled') setUnreadCount(notif.value.unreadCount || 0);

    if (ev.status === 'fulfilled') {
      const all: any[] = ev.value.events || [];
      const mine = all.filter((e) => !e.college || !college || e.college === college);
      setEvents(mine.slice(0, 3));
    } else {
      setEvents([]);
    }

    setPosts(bz.status === 'fulfilled' ? (bz.value.posts || []).slice(0, 3) : []);
    setFailed(ev.status === 'rejected' && bz.status === 'rejected');
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const Skeleton = ({ height }: { height: number }) => (
    <View style={[styles.skeleton, { height }]} />
  );

  const SectionHeader = ({ title, onSeeAll }: { title: string; onSeeAll: () => void }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <TouchableOpacity
        onPress={onSeeAll}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityRole="button"
      >
        <Text style={styles.seeAll}>See all</Text>
      </TouchableOpacity>
    </View>
  );

  const openEvents = () => navigation.navigate('Buzz', { screen: 'BuzzMain', params: { tab: 'events' } });
  const openBuzz = () => navigation.navigate('Buzz');

  const renderEvent = (item: any) => {
    const d = new Date(item.start_date);
    const valid = !isNaN(d.getTime());
    const meta = [item.event_type, item.is_online ? 'Online' : item.location].filter(Boolean).join('  |  ');
    return (
      <TouchableOpacity key={item.id} style={styles.rowCard} activeOpacity={0.8} onPress={openEvents}>
        <View style={styles.dateBox}>
          <Text style={styles.dateMonth}>{valid ? MONTHS[d.getMonth()] : '--'}</Text>
          <Text style={styles.dateDay}>{valid ? d.getDate() : '--'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
          {!!meta && <Text style={styles.rowMeta} numberOfLines={1}>{meta}</Text>}
          {Number(item.interested_count) > 0 && (
            <Text style={styles.rowMeta}>{item.interested_count} interested</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textDim} />
      </TouchableOpacity>
    );
  };

  const renderPost = (item: any) => (
    <TouchableOpacity key={item.id} style={styles.postCard} activeOpacity={0.8} onPress={openBuzz}>
      <View style={styles.postTop}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{item.category || 'Other'}</Text>
        </View>
        <Text style={styles.rowMeta}>{item.author}</Text>
      </View>
      <Text style={styles.postText} numberOfLines={2}>{item.content}</Text>
      <View style={styles.postBottom}>
        <Ionicons name="chatbubble-outline" size={13} color={Colors.textMuted} />
        <Text style={styles.rowMeta}>{item.comment_count ?? 0}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.accent} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.username} numberOfLines={1}>
              {user?.anonymous_handle || 'Welcome'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Chats')}
            accessibilityRole="button"
            accessibilityLabel="Messages"
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { marginLeft: 10 }]}
            onPress={() => navigation.navigate('Profile', { screen: 'Notifications' })}
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

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroPill}>
            <Ionicons name="location" size={12} color="#FFFFFF" />
            <Text style={styles.heroPillText}>YOUR CAMPUS</Text>
          </View>
          <Text style={styles.heroCollege} numberOfLines={2}>
            {user?.college || 'Campus Connect'}
          </Text>
          <Text style={styles.heroSub}>
            Marketplace, events, study help and safety for your campus.
          </Text>
        </View>

        {failed && (
          <View style={styles.failedCard}>
            <Ionicons name="cloud-offline-outline" size={20} color={Colors.warn} />
            <Text style={styles.failedText}>
              Could not load campus updates. Pull down to try again.
            </Text>
          </View>
        )}

        {/* Study and Career */}
        <View style={styles.tilesRow}>
          <TouchableOpacity
            style={styles.tile}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Academic')}
            accessibilityRole="button"
          >
            <View style={[styles.tileIcon, { backgroundColor: Colors.accent + '2E' }]}>
              <Ionicons name="school" size={22} color={Colors.accent} />
            </View>
            <Text style={styles.tileTitle}>Study</Text>
            <Text style={styles.tileSub}>Notes, doubts, planner, PYQs</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tile}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Career')}
            accessibilityRole="button"
          >
            <View style={[styles.tileIcon, { backgroundColor: Colors.accentAlt + '2E' }]}>
              <Ionicons name="briefcase" size={22} color={Colors.accentAlt} />
            </View>
            <Text style={styles.tileTitle}>Career</Text>
            <Text style={styles.tileSub}>Internships, gigs, resume AI</Text>
          </TouchableOpacity>
        </View>

        {/* CampusBot */}
        <TouchableOpacity
          style={styles.botBar}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('CampusChat')}
          accessibilityRole="button"
        >
          <View style={styles.botIcon}>
            <Ionicons name="sparkles" size={18} color={Colors.accentAlt} />
          </View>
          <Text style={styles.botText}>Ask CampusBot anything</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Happening soon */}
        <View style={styles.section}>
          <SectionHeader title="Happening soon" onSeeAll={openEvents} />
          {events === null ? (
            <Skeleton height={76} />
          ) : events.length === 0 ? (
            <TouchableOpacity style={styles.emptyCard} activeOpacity={0.8} onPress={openEvents}>
              <Ionicons name="calendar-outline" size={22} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No upcoming events yet. Tap to browse or create one.</Text>
            </TouchableOpacity>
          ) : (
            events.map(renderEvent)
          )}
        </View>

        {/* Buzz */}
        <View style={styles.section}>
          <SectionHeader title="Fresh on Buzz" onSeeAll={openBuzz} />
          {posts === null ? (
            <Skeleton height={90} />
          ) : posts.length === 0 ? (
            <TouchableOpacity style={styles.emptyCard} activeOpacity={0.8} onPress={openBuzz}>
              <Ionicons name="flash-outline" size={22} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Nothing here yet. Be the first to post on Buzz.</Text>
            </TouchableOpacity>
          ) : (
            posts.map(renderPost)
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const makeStyles = (Colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll: { paddingBottom: 110 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
    greeting: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
    username: { fontSize: 22, fontWeight: '800', color: Colors.text, marginTop: 1, letterSpacing: -0.3 },
    iconBtn: {
      width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.card,
      borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center',
    },
    badge: {
      position: 'absolute', top: -3, right: -3, backgroundColor: Colors.danger, borderRadius: 9,
      minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
      borderWidth: 2, borderColor: Colors.bg,
    },
    badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },

    hero: { marginHorizontal: 16, borderRadius: 20, backgroundColor: HERO, padding: 18 },
    heroPill: {
      flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4,
      backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4,
    },
    heroPillText: { color: '#FFFFFF', fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8 },
    heroCollege: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginTop: 10, letterSpacing: -0.4 },
    heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.88)', marginTop: 4, lineHeight: 18 },

    failedCard: {
      flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginTop: 12,
      backgroundColor: Colors.warn + '1F', borderRadius: 14, borderWidth: 1, borderColor: Colors.warn + '66', padding: 12,
    },
    failedText: { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 18 },

    tilesRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 14 },
    tile: {
      flex: 1, backgroundColor: Colors.card, borderRadius: 18, borderWidth: 1,
      borderColor: Colors.border, padding: 14, minHeight: 112,
    },
    tileIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    tileTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginTop: 10 },
    tileSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2, lineHeight: 16 },

    botBar: {
      flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginTop: 12,
      backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 16,
      paddingHorizontal: 12, paddingVertical: 10, minHeight: 52,
    },
    botIcon: {
      width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.accentAlt + '2E',
      alignItems: 'center', justifyContent: 'center',
    },
    botText: { flex: 1, fontSize: 14, color: Colors.textMuted },

    section: { paddingHorizontal: 16, marginTop: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
    seeAll: { fontSize: 12.5, fontWeight: '700', color: Colors.accent },

    skeleton: { backgroundColor: Colors.card, borderRadius: 14, opacity: 0.7 },
    emptyCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.card,
      borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 14,
    },
    emptyText: { flex: 1, fontSize: 13, color: Colors.textMuted, lineHeight: 18 },

    rowCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.card,
      borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 12, marginBottom: 8,
    },
    dateBox: {
      width: 48, height: 52, borderRadius: 12, backgroundColor: Colors.accent + '2E',
      alignItems: 'center', justifyContent: 'center',
    },
    dateMonth: { fontSize: 10, fontWeight: '800', color: Colors.accent, letterSpacing: 0.5 },
    dateDay: { fontSize: 18, fontWeight: '800', color: Colors.text, marginTop: 1 },
    rowTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
    rowMeta: { fontSize: 11.5, color: Colors.textMuted, marginTop: 2 },

    postCard: {
      backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
      padding: 12, marginBottom: 8,
    },
    postTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    chip: { backgroundColor: Colors.accent + '2E', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    chipText: { fontSize: 10.5, fontWeight: '700', color: Colors.accent },
    postText: { fontSize: 13.5, color: Colors.text, marginTop: 8, lineHeight: 19 },
    postBottom: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  });