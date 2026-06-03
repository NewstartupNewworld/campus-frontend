import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../theme/colors';

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

const statusColor = (s: ChatPreview['status']) =>
  s === 'accepted' ? Colors.success : s === 'pending' ? Colors.warn : Colors.danger;

const statusLabel = (s: ChatPreview['status']) =>
  s === 'accepted' ? 'Active' : s === 'pending' ? 'Pending' : 'Rejected';

export const ChatsListScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setChats(data.chats || []);
      }
    } catch (err) {
      console.error('Error loading chats:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: ChatPreview }) => (
    <TouchableOpacity
      style={styles.chatRow}
      onPress={() => navigation.navigate('ChatRoom', {
        chatId: item.id,
        listingTitle: item.listingTitle,
      })}
      activeOpacity={0.8}
    >
      <View style={styles.avatar}>
        <Text style={{ fontSize: 20 }}>{item.role === 'buyer' ? '🛍️' : '🏷️'}</Text>
      </View>
      <View style={styles.chatContent}>
        <View style={styles.chatTop}>
          <Text style={styles.chatTitle} numberOfLines={1}>{item.listingTitle}</Text>
          <Text style={styles.chatTime}>{item.lastMessageTime}</Text>
        </View>
        <View style={styles.chatBottom}>
          <Text style={styles.chatLast} numberOfLines={1}>{item.lastMessage}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={[styles.statusDot, { backgroundColor: statusColor(item.status) }]} />
            <Text style={[styles.statusText, { color: statusColor(item.status) }]}>
              {statusLabel(item.status)}
            </Text>
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <Text style={styles.headerSub}>Your marketplace conversations</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={chats}
          renderItem={renderItem}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onRefresh={loadChats}
          refreshing={loading}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No chats yet. Express interest in a listing to start!
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: Colors.text },
  headerSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  list: { paddingBottom: 20 },
  chatRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  chatContent: { flex: 1 },
  chatTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  chatTitle: { fontWeight: '700', fontSize: 14, color: Colors.text, flex: 1, marginRight: 8 },
  chatTime: { fontSize: 11, color: Colors.textDim },
  chatBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatLast: { fontSize: 12, color: Colors.textMuted, flex: 1, marginRight: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  unreadBadge: {
    backgroundColor: Colors.accent, borderRadius: 10,
    minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  separator: { height: 1, backgroundColor: Colors.border, marginLeft: 76 },
  empty: {
    textAlign: 'center', color: Colors.textMuted,
    marginTop: 60, paddingHorizontal: 32, lineHeight: 22,
  },
});