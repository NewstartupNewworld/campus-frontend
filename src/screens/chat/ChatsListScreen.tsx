import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '../../theme/ThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = 'https://campus-backend-production-2dbb.up.railway.app';

interface ChatPreview {
  id: string;
  listingTitle: string;
  lastMessage: string;
  lastMessageTime: string;
  status: 'pending' | 'accepted' | 'rejected';
  unreadCount: number;
  role: 'buyer' | 'seller';
}

type RootStackParamList = {
  ChatRoom: { chatId: string; listingTitle: string };
};

const softShadow = {
  shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
};

const statusLabel = (s: ChatPreview['status']) =>
  s === 'accepted' ? 'Active' : s === 'pending' ? 'Pending' : 'Rejected';

export const ChatsListScreen = () => {
  const Colors = useColors();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
    headerTitle: { fontSize: 20, fontWeight: '900', color: Colors.text },
    headerSub: { fontSize: 11.5, color: Colors.textMuted, marginTop: 1 },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginBottom: 4 },
    list: { paddingBottom: 20, paddingTop: 6 },

    // Each chat row — card style with shadow, no separator line
    chatCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      marginHorizontal: 14, marginBottom: 8,
      backgroundColor: Colors.card, borderRadius: 16,
      padding: 12, ...softShadow,
    },
    chatCardUnread: { backgroundColor: Colors.card },

    // Gradient avatar circle
    avatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 18 },

    chatContent: { flex: 1 },
    chatTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
    chatTitle: { fontWeight: '700', fontSize: 13.5, color: Colors.text, flex: 1, marginRight: 8 },
    chatTime: { fontSize: 10.5, color: Colors.textDim },
    chatBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    chatLast: { fontSize: 12, color: Colors.textMuted, flex: 1, marginRight: 8 },

    // Status pill — colored dot inline
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statusDot: { width: 5, height: 5, borderRadius: 3 },
    statusText: { fontSize: 10.5, fontWeight: '700' },

    // Unread badge
    unreadBadge: {
      backgroundColor: Colors.accent, borderRadius: 10,
      minWidth: 17, height: 17, alignItems: 'center',
      justifyContent: 'center', paddingHorizontal: 4, marginLeft: 4,
    },
    unreadText: { color: '#fff', fontSize: 10, fontWeight: '800' },

    empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 60, paddingHorizontal: 32, lineHeight: 22, fontSize: 13 },
  });

  const getStatusColor = (s: ChatPreview['status']) =>
    s === 'accepted' ? Colors.success : s === 'pending' ? Colors.warn : Colors.danger;

  useEffect(() => { loadChats(); }, []);

  const loadChats = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/chats`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) { const data = await response.json(); setChats(data.chats || []); }
    } catch (err) { console.error('Error loading chats:', err); }
    finally { setLoading(false); }
  };

  const renderItem = ({ item }: { item: ChatPreview }) => {
    const statusColor = getStatusColor(item.status);
    return (
      <TouchableOpacity
        style={styles.chatCard}
        onPress={() => navigation.navigate('ChatRoom', { chatId: item.id, listingTitle: item.listingTitle })}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={item.role === 'buyer' ? [Colors.accent, Colors.accentAlt] : [Colors.accentAlt, Colors.accent]}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>{item.role === 'buyer' ? '🛍️' : '🏷️'}</Text>
        </LinearGradient>
        <View style={styles.chatContent}>
          <View style={styles.chatTop}>
            <Text style={styles.chatTitle} numberOfLines={1}>{item.listingTitle}</Text>
            <Text style={styles.chatTime}>{item.lastMessageTime}</Text>
          </View>
          <View style={styles.chatBottom}>
            <Text style={styles.chatLast} numberOfLines={1}>
              {item.lastMessage || (item.status === 'pending' ? 'Waiting for seller response...' : 'No messages yet')}
            </Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel(item.status)}</Text>
              {item.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unreadCount}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💬 Chats</Text>
        <Text style={styles.headerSub}>Your marketplace conversations</Text>
      </View>
      <View style={styles.divider} />
      {loading ? (
        <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={chats}
          renderItem={renderItem}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.list}
          onRefresh={loadChats}
          refreshing={loading}
          ListEmptyComponent={
            <Text style={styles.empty}>No chats yet.{'\n'}Express interest in a listing to start! 👋</Text>
          }
        />
      )}
    </SafeAreaView>
  );
};