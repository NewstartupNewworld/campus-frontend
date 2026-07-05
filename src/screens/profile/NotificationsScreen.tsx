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
  id: string; type: string; title: string;
  body: string; data: any; read: boolean; created_at: string;
}

const softShadow = {
  shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
};

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
  chat_accepted: '🎉', new_rating: '⭐',
  new_message: '💬', cross_college: '🏫', default: '🔔',
};

const NOTIF_COLORS: Record<string, string> = {
  chat_accepted: '#22C55E', new_rating: '#F97316',
  new_message: '#4F7CFF', cross_college: '#7C5CFF', default: '#94A3B8',
};

export const NotificationsScreen = () => {
  const Colors = useColors();
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },

    // Header — hairline divider, back button as pill
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11 },
    backBtn: { width: 34, height: 34, borderRadius: 11, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', ...softShadow },
    backText: { color: Colors.text, fontSize: 18 },
    headerTitle: { flex: 1, fontWeight: '800', fontSize: 17, color: Colors.text },
    markAllRead: { fontSize: 12, fontWeight: '700', color: Colors.accent },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginBottom: 6 },

    list: { padding: 14 },

    // Notification card — shadow, no border; unread = accent tint bg
    notifCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: Colors.card, borderRadius: 16, padding: 13, marginBottom: 9, ...softShadow },
    notifCardUnread: { backgroundColor: Colors.accent + '0E' },

    // Icon wrap — colored tint circle
    notifIconWrap: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    notifIcon: { fontSize: 20 },

    notifBody: { flex: 1 },
    notifTitle: { fontWeight: '700', fontSize: 13.5, color: Colors.text },
    notifText: { fontSize: 12.5, color: Colors.textMuted, marginTop: 2, lineHeight: 18 },
    notifTime: { fontSize: 10.5, color: Colors.textDim, marginTop: 5 },

    // Unread dot — accent colored
    unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.accent, marginTop: 5 },

    emptyWrap: { alignItems: 'center', marginTop: 80 },
    emptyIcon: { fontSize: 38, marginBottom: 12 },
    emptyText: { fontSize: 15, fontWeight: '700', color: Colors.text },
    emptySub: { fontSize: 13, color: Colors.textMuted, marginTop: 4, textAlign: 'center', paddingHorizontal: 30 },
  });

  const fetchNotifications = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (response.ok) setNotifications(data.notifications || []);
    } catch (e) { console.error('Fetch notifications error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(`${API_URL}/api/notifications/read-all`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
    } catch (e) {}
  };

  const handleNotificationPress = async (notif: Notification) => {
    if (!notif.read) {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
      try {
        const token = await AsyncStorage.getItem('token');
        await fetch(`${API_URL}/api/notifications/${notif.id}/read`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
      } catch (e) {}
    }
    if (notif.type === 'chat_accepted' && notif.data?.chatId) {
      (navigation as any).navigate('ChatRoom', { chatId: notif.data.chatId, listingTitle: '' });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔔 Notifications</Text>
        {notifications.some(n => !n.read) && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllRead}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.divider} />

      {loading ? (
        <ActivityIndicator color={Colors.accent} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={n => n.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} tintColor={Colors.accent} />}
          renderItem={({ item }) => {
            const iconColor = NOTIF_COLORS[item.type] || NOTIF_COLORS.default;
            return (
              <TouchableOpacity
                style={[styles.notifCard, !item.read && styles.notifCardUnread]}
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.8}
              >
                <View style={[styles.notifIconWrap, { backgroundColor: iconColor + '20' }]}>
                  <Text style={styles.notifIcon}>{NOTIF_ICONS[item.type] || NOTIF_ICONS.default}</Text>
                </View>
                <View style={styles.notifBody}>
                  <Text style={styles.notifTitle}>{item.title}</Text>
                  <Text style={styles.notifText}>{item.body}</Text>
                  <Text style={styles.notifTime}>{timeAgo(item.created_at)}</Text>
                </View>
                {!item.read && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          }}
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