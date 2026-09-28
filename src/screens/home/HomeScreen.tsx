import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '../../theme/ThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = 'https://campus-backend-arfy.onrender.com';

const softShadow = {
  shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
};
const cardShadow = {
  shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.18, shadowRadius: 10, elevation: 5,
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning 👋';
  if (h < 17) return 'Good afternoon 👋';
  return 'Good evening 👋';
};

export const HomeScreen = () => {
  const Colors = useColors();
  const navigation = useNavigation();
  const [user, setUser] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll: { paddingBottom: 30 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
    greeting: { fontSize: 12.5, color: Colors.textMuted, fontWeight: '600' },
    username: { fontSize: 20, fontWeight: '900', color: Colors.text, marginTop: 1 },
    bellBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', ...softShadow },
    bellIcon: { fontSize: 16 },
    bellBadge: { position: 'absolute', top: -3, right: -3, backgroundColor: Colors.danger, borderRadius: 8, minWidth: 15, height: 15, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
    bellBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
    welcomeCard: { marginHorizontal: 16, marginBottom: 18, borderRadius: 18, overflow: 'hidden', ...cardShadow },
    welcomeGradient: { padding: 18 },
    welcomeTitle: { fontSize: 17, fontWeight: '900', color: '#fff', marginBottom: 4 },
    welcomeSub: { fontSize: 12.5, color: 'rgba(255,255,255,0.75)', lineHeight: 19 },
    welcomeCollege: { fontSize: 12.5, fontWeight: '700', color: 'rgba(255,255,255,0.9)', marginTop: 8 },
    section: { paddingHorizontal: 16, marginBottom: 18 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionTitle: { fontSize: 14.5, fontWeight: '800', color: Colors.text },
    seeAll: { fontSize: 12, fontWeight: '700', color: Colors.accent },
    quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    quickCard: { flex: 1, minWidth: '45%', backgroundColor: Colors.card, borderRadius: 16, padding: 14, alignItems: 'center', gap: 6, ...softShadow },
    quickIcon: { fontSize: 26 },
    quickLabel: { fontSize: 12, fontWeight: '800', color: Colors.text, textAlign: 'center' },
    quickSub: { fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
    statRow: { flexDirection: 'row', gap: 10 },
    statCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 14, padding: 12, alignItems: 'center', gap: 3, ...softShadow },
    statIcon: { fontSize: 19 },
    statValue: { fontSize: 19, fontWeight: '900', color: Colors.accent },
    statLabel: { fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
    announcementCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 13, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12, ...softShadow },
    announcementIconWrap: { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
    announcementIcon: { fontSize: 20 },
    announcementTitle: { fontSize: 13, fontWeight: '700', color: Colors.text },
    announcementSub: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
    announcementArrow: { color: Colors.textDim, fontSize: 14, marginLeft: 'auto' },
  });

  useEffect(() => { loadUser(); loadUnread(); }, []);

  const loadUser = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) setUser(JSON.parse(userStr));
    } catch (e) {}
  };

  const loadUnread = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setUnreadCount(data.unreadCount || 0);
    } catch (e) {}
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUser();
    await loadUnread();
    setRefreshing(false);
  };

  const QUICK_ACTIONS = [
    { icon: '🛍️', label: 'Marketplace', sub: 'Buy & Sell', screen: 'Marketplace' },
    { icon: '⚡', label: 'Buzz Feed', sub: 'Campus updates', screen: 'Buzz' },
    { icon: '💬', label: 'Chats', sub: 'Messages', screen: 'Chats' },
    { icon: '🤖', label: 'CampusBot', sub: 'AI Assistant', screen: 'CampusChat' },
  ];

  const ANNOUNCEMENTS = [
    { icon: '📢', title: 'Welcome to CampusConnect!', sub: 'Your verified campus community' },
    { icon: '🍕', title: 'Free Food Alert', sub: 'Check Buzz for campus events' },
    { icon: '📚', title: 'Study Groups Active', sub: 'Join groups in Buzz tab' },
    { icon: '🚨', title: 'SOS Emergency', sub: 'Press SOS button for help' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.accent} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.username}>{user?.anonymous_handle || 'CampusOwl'}</Text>
          </View>
          <TouchableOpacity style={styles.bellBtn} onPress={() => (navigation as any).navigate('Notifications')}>
            <Text style={styles.bellIcon}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Welcome card */}
        <View style={styles.welcomeCard}>
          <LinearGradient colors={[Colors.accent, Colors.accentAlt]} style={styles.welcomeGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.welcomeTitle}>🎓 Your Campus Hub</Text>
            <Text style={styles.welcomeSub}>Buy, sell, connect and stay safe — all in one verified campus app.</Text>
            {user?.college && <Text style={styles.welcomeCollege}>📍 {user.college}</Text>}
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <View style={styles.quickGrid}>
            {QUICK_ACTIONS.map(action => (
              <TouchableOpacity key={action.label} style={styles.quickCard} onPress={() => (navigation as any).navigate(action.screen)} activeOpacity={0.8}>
                <Text style={styles.quickIcon}>{action.icon}</Text>
                <Text style={styles.quickLabel}>{action.label}</Text>
                <Text style={styles.quickSub}>{action.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Campus Stats */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Campus Activity</Text>
          </View>
          <View style={styles.statRow}>
            {[
              { icon: '🛍️', value: '24', label: 'Listings' },
              { icon: '⚡', value: '12', label: 'Buzz Posts' },
              { icon: '👥', value: '8', label: 'Groups' },
            ].map(s => (
              <View key={s.label} style={styles.statCard}>
                <Text style={styles.statIcon}>{s.icon}</Text>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Campus Updates */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Campus Updates</Text>
            <TouchableOpacity onPress={() => (navigation as any).navigate('Buzz')}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          {ANNOUNCEMENTS.map((item, i) => (
            <TouchableOpacity key={i} style={styles.announcementCard} onPress={() => (navigation as any).navigate('Buzz')} activeOpacity={0.8}>
              <View style={styles.announcementIconWrap}>
                <Text style={styles.announcementIcon}>{item.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.announcementTitle}>{item.title}</Text>
                <Text style={styles.announcementSub}>{item.sub}</Text>
              </View>
              <Text style={styles.announcementArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};