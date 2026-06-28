import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '../../theme/ThemeProvider';

const API_URL = 'https://campus-backend-production-2dbb.up.railway.app';

export const HomeScreen = () => {
  const Colors = useColors();
  const navigation = useNavigation();
  const [user, setUser] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
    },
    greeting: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
    username: { fontSize: 22, fontWeight: '900', color: Colors.text, marginTop: 2 },
    bellBtn: {
      width: 42, height: 42, borderRadius: 21,
      backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
      alignItems: 'center', justifyContent: 'center',
    },
    bellBadge: {
      position: 'absolute', top: -2, right: -2,
      backgroundColor: Colors.danger, borderRadius: 8,
      minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: 3,
    },
    bellBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
    section: { paddingHorizontal: 16, marginBottom: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
    seeAll: { fontSize: 12, fontWeight: '700', color: Colors.accent },
    quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    quickCard: {
      flex: 1, minWidth: '45%', backgroundColor: Colors.card,
      borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
      padding: 16, alignItems: 'center', gap: 8,
    },
    quickIcon: { fontSize: 28 },
    quickLabel: { fontSize: 12, fontWeight: '700', color: Colors.text, textAlign: 'center' },
    quickSub: { fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
    announcementCard: {
      backgroundColor: Colors.card, borderRadius: 16,
      borderWidth: 1, borderColor: Colors.border,
      padding: 14, marginBottom: 10,
      flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    announcementIcon: { fontSize: 24 },
    announcementTitle: { fontSize: 13, fontWeight: '700', color: Colors.text },
    announcementSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
    statRow: { flexDirection: 'row', gap: 10 },
    statCard: {
      flex: 1, backgroundColor: Colors.card, borderRadius: 16,
      borderWidth: 1, borderColor: Colors.border,
      padding: 14, alignItems: 'center', gap: 4,
    },
    statIcon: { fontSize: 22 },
    statValue: { fontSize: 20, fontWeight: '900', color: Colors.accent },
    statLabel: { fontSize: 11, color: Colors.textMuted, textAlign: 'center' },
    welcomeCard: {
      margin: 16, padding: 20, borderRadius: 20,
      backgroundColor: Colors.accent + '15',
      borderWidth: 1, borderColor: Colors.accent + '30',
    },
    welcomeTitle: { fontSize: 18, fontWeight: '900', color: Colors.text, marginBottom: 4 },
    welcomeSub: { fontSize: 13, color: Colors.textMuted, lineHeight: 20 },
    college: { fontSize: 13, fontWeight: '700', color: Colors.accent, marginTop: 6 },
  });

  useEffect(() => {
    loadUser();
    loadUnread();
  }, []);

  const loadUser = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) setUser(JSON.parse(userStr));
    } catch (e) {}
  };

  const loadUnread = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
    { icon: '👥', label: 'Groups', sub: 'Communities', screen: 'Buzz' },
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.accent} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning 👋</Text>
            <Text style={styles.username}>{user?.anonymous_handle || 'CampusOwl'}</Text>
          </View>
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => (navigation as any).navigate('Profile')}
          >
            <Text style={{ fontSize: 18 }}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>🎓 Your Campus Hub</Text>
          <Text style={styles.welcomeSub}>
            Buy, sell, connect and stay safe — all in one verified campus app.
          </Text>
          {user?.college && <Text style={styles.college}>📍 {user.college}</Text>}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <View style={styles.quickGrid}>
            {QUICK_ACTIONS.map(action => (
              <TouchableOpacity
                key={action.label}
                style={styles.quickCard}
                onPress={() => (navigation as any).navigate(action.screen)}
                activeOpacity={0.8}
              >
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
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🛍️</Text>
              <Text style={styles.statValue}>24</Text>
              <Text style={styles.statLabel}>Active Listings</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>⚡</Text>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Buzz Posts</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>👥</Text>
              <Text style={styles.statValue}>8</Text>
              <Text style={styles.statLabel}>Groups</Text>
            </View>
          </View>
        </View>

        {/* Announcements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Campus Updates</Text>
            <TouchableOpacity onPress={() => (navigation as any).navigate('Buzz')}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          {ANNOUNCEMENTS.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.announcementCard}
              onPress={() => (navigation as any).navigate('Buzz')}
              activeOpacity={0.8}
            >
              <Text style={styles.announcementIcon}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.announcementTitle}>{item.title}</Text>
                <Text style={styles.announcementSub}>{item.sub}</Text>
              </View>
              <Text style={{ color: Colors.textDim, fontSize: 16 }}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};