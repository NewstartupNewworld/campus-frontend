import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '../../theme/ThemeProvider';

const API_URL = 'https://campus-backend-production-2dbb.up.railway.app';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: any;
  read: boolean;
  created_at: string;
}

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const NOTIF_ICONS: Record<string, string> = {
  chat_accepted: '🎉',
  new_rating: '⭐',
  new_message: '💬',
  cross_college: '🏫',
  default: '🔔',
};

export const NotificationsScreen = () => {
  const Colors = useColors();
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
    backBtn: { padding: 4 },
    backText: { color: Colors.text, fontSize: 22 },
    headerTitle: { flex: 1, fontWeight: '800', fontSize: 17, color: Colors.text },
    markAllRead: { fontSize: 12, fontWeight: '700', color: Colors.accent },
    list: { padding: 14 },
    notifCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 14, marginBottom: 10 },
    notifCardUnread: { borderColor: Colors.accent + '55', backgroundColor: Colors.accent + '0A' },
    notifIcon: { fontSize: 24 },
    notifBody: { flex: 1 },
    notifTitle: { fontWeight: '700', fontSize: 14, color: Colors.text },
    notifText: { fontSize: 13, color: Colors.textMuted, marginTop: 2, lineHeight: 18 },
    notifTime: { fontSize: 11, color: Colors.textDim, marginTop: 6 },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accent, marginTop: 4 },
    emptyWrap: { alignItems: 'center', marginTop: 80 },
    emptyIcon: { fontSize: 40, marginBottom: 12 },
    emptyText: { fontSize: 16, fontWeight: '700', color: Colors.text },
    emptySub: { fontSize: 13, color: Colors.textMuted, marginTop: 4, textAlign: 'center', paddingHorizontal: 30 },
  });

  const fetchNotifications = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setNotifications(data.notifications || []);
    } catch (e) {
      console.error('Fetch notifications error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(`${API_URL}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {}
  };

  const handleNotificationPress = async (notif: Notification) => {
    if (!notif.read) {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
      try {
        const token = await AsyncStorage.getItem('token');
        await fetch(`${API_URL}/api/notifications/${notif.id}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {}
    }
    if (notif.type === 'chat_accepted' && notif.data?.chatId) {
      (navigation as any).navigate('ChatRoom', { chatId: notif.data.chatId, listingTitle: '' });
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifications.some(n => !n.read) && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllRead}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.accent} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={n => n.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.accent} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.notifCard, !item.read && styles.notifCardUnread]}
              onPress={() => handleNotificationPress(item)}
              activeOpacity={0.8}
            >
              <Text style={styles.notifIcon}>{NOTIF_ICONS[item.type] || NOTIF_ICONS.default}</Text>
              <View style={styles.notifBody}>
                <Text style={styles.notifTitle}>{item.title}</Text>
                <Text style={styles.notifText}>{item.body}</Text>
                <Text style={styles.notifTime}>{timeAgo(item.created_at)}</Text>
              </View>
              {!item.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyText}>No notifications yet</Text>
              <Text style={styles.emptySub}>We'll let you know when something happens</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};