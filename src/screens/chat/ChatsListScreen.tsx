import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../theme/ThemeProvider';

const API_URL = 'https://campus-backend-arfy.onrender.com';
const PRIMARY = '#2F54EB';

interface ChatPreview {
  id: string;
  listingTitle: string;
  lastMessage: string;
  lastTime: string;
  status: 'pending' | 'accepted' | 'rejected';
  unreadCount: number;
  role: 'buyer' | 'seller';
}

// The server sends snake_case names, so accept both spellings
const normalize = (c: any): ChatPreview => ({
  id: String(c.id),
  listingTitle: c.listingTitle ?? c.listing_title ?? 'Listing',
  lastMessage: c.lastMessage ?? c.last_message ?? '',
  lastTime: c.lastMessageTime ?? c.last_message_time ?? c.created_at ?? '',
  status: c.status === 'accepted' || c.status === 'rejected' ? c.status : 'pending',
  unreadCount: Number(c.unreadCount ?? c.unread_count ?? 0) || 0,
  role: c.role === 'seller' ? 'seller' : 'buyer',
});

const timeLabel = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
};

export const ChatsListScreen = () => {
  const Colors = useColors();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  const loadChats = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setChats((data.chats || []).map(normalize));
        setFailed(false);
      } else {
        setFailed(true);
      }
    } catch (err) {
      setFailed(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, [loadChats])
  );

  const statusInfo = (c: ChatPreview) => {
    if (c.status === 'pending') {
      return c.role === 'seller'
        ? { label: 'New request', color: Colors.accent }
        : { label: 'Waiting', color: Colors.warn };
    }
    if (c.status === 'accepted') return { label: 'Active', color: Colors.success };
    return { label: 'Declined', color: Colors.danger };
  };

  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Marketplace');
  };

  const renderItem = ({ item }: { item: ChatPreview }) => {
    const st = statusInfo(item);
    const preview =
      item.lastMessage ||
      (item.status === 'pending'
        ? item.role === 'seller'
          ? 'Someone wants to chat. Tap to accept.'
          : 'Waiting for the seller to accept'
        : 'No messages yet');
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('ChatRoom', { chatId: item.id, listingTitle: item.listingTitle })}
        accessibilityRole="button"
        accessibilityLabel={`Chat about ${item.listingTitle}, ${st.label}`}
      >
        <View style={[styles.avatar, { backgroundColor: item.role === 'buyer' ? PRIMARY : Colors.accentAlt }]}>
          <Ionicons name={item.role === 'buyer' ? 'bag-handle' : 'pricetag'} size={20} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.topRow}>
            <Text style={styles.title} numberOfLines={1}>{item.listingTitle}</Text>
            <Text style={styles.time}>{timeLabel(item.lastTime)}</Text>
          </View>
          <Text style={styles.preview} numberOfLines={1}>{preview}</Text>
          <View style={styles.bottomRow}>
            <View style={[styles.chip, { backgroundColor: st.color + '2E' }]}>
              <View style={[styles.dot, { backgroundColor: st.color }]} />
              <Text style={[styles.chipText, { color: st.color }]}>{st.label}</Text>
            </View>
            <Text style={styles.roleText}>{item.role === 'buyer' ? 'You are buying' : 'You are selling'}</Text>
            {item.unreadCount > 0 && (
              <View style={styles.unread}>
                <Text style={styles.unreadText}>{item.unreadCount > 9 ? '9+' : item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={goBack} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Chats</Text>
          <Text style={styles.headerSub}>Your marketplace conversations</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
      ) : failed && chats.length === 0 ? (
        <View style={styles.stateWrap}>
          <Ionicons name="cloud-offline-outline" size={34} color={Colors.warn} />
          <Text style={styles.stateTitle}>Could not load your chats</Text>
          <Text style={styles.stateSub}>Check your internet and try again.</Text>
          <TouchableOpacity style={styles.stateBtn} onPress={() => { setLoading(true); loadChats(); }}>
            <Text style={styles.stateBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderItem}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={() => { setRefreshing(true); loadChats(); }}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.stateWrap}>
              <Ionicons name="chatbubbles-outline" size={36} color={Colors.textMuted} />
              <Text style={styles.stateTitle}>No chats yet</Text>
              <Text style={styles.stateSub}>Tap Chat on a listing to start a conversation with the seller.</Text>
              <TouchableOpacity style={styles.stateBtn} onPress={() => navigation.navigate('Marketplace')}>
                <Text style={styles.stateBtnText}>Browse the market</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
};

const makeStyles = (Colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 },
    iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.text, letterSpacing: -0.4 },
    headerSub: { fontSize: 13, color: Colors.textMuted, marginTop: 1 },
    list: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 120 },
    card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 12, marginBottom: 10 },
    avatar: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    title: { flex: 1, fontSize: 14.5, fontWeight: '700', color: Colors.text },
    time: { fontSize: 11.5, color: Colors.textMuted },
    preview: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
    bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    dot: { width: 6, height: 6, borderRadius: 3 },
    chipText: { fontSize: 11, fontWeight: '700' },
    roleText: { flex: 1, fontSize: 11.5, color: Colors.textMuted },
    unread: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
    unreadText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
    stateWrap: { alignItems: 'center', marginTop: 70, paddingHorizontal: 28, gap: 6 },
    stateTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 6 },
    stateSub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
    stateBtn: { marginTop: 12, minHeight: 44, borderRadius: 22, backgroundColor: PRIMARY, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' },
    stateBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  });