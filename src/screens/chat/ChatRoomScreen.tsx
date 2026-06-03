import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';
import { Colors } from '../../theme/colors';
import { RatingModal } from '../../components/RatingModal';

const SOCKET_URL = 'https://campus-backend-production-2dbb.up.railway.app';

type ChatStatus = 'pending' | 'accepted' | 'rejected';

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
  type: 'text' | 'system';
}

interface ChatMeta {
  id: string;
  status: ChatStatus;
  listingTitle: string;
  listingImage: string;
  sellerName?: string;
  sellerCollege?: string;
  sellerId?: string;
}

type RootStackParamList = {
  ChatRoom: { chatId: string; listingTitle: string };
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
};

const MessageBubble = ({ message, isOwn }: { message: Message; isOwn: boolean }) => {
  if (message.type === 'system') {
    return (
      <View style={styles.systemMsgWrap}>
        <Text style={styles.systemMsg}>{message.text}</Text>
      </View>
    );
  }
  return (
    <View style={[styles.bubbleRow, isOwn ? styles.bubbleRowOwn : styles.bubbleRowOther]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        <Text style={[styles.bubbleText, isOwn && styles.bubbleTextOwn]}>{message.text}</Text>
        <Text style={[styles.bubbleTime, isOwn && styles.bubbleTimeOwn]}>
          {formatTime(message.createdAt)}{isOwn && '  ✓✓'}
        </Text>
      </View>
    </View>
  );
};

const PendingBanner = ({ listingTitle }: { listingTitle: string }) => (
  <View style={styles.pendingBanner}>
    <Text style={styles.pendingIcon}>🎭</Text>
    <View style={styles.pendingText}>
      <Text style={styles.pendingTitle}>Chat Request Pending</Text>
      <Text style={styles.pendingSub}>Re: <Text style={{ color: Colors.text }}>{listingTitle}</Text></Text>
      <Text style={styles.pendingSub}>Seller identity hidden until they accept.</Text>
    </View>
    <View style={[styles.statusDot, { backgroundColor: Colors.warn }]} />
  </View>
);

const AcceptedBanner = ({ meta }: { meta: ChatMeta }) => (
  <View style={[styles.pendingBanner, { borderColor: Colors.success + '44', backgroundColor: Colors.success + '0F' }]}>
    <View style={styles.sellerAvatarSmall}>
      <Text style={{ fontSize: 16 }}>👤</Text>
    </View>
    <View style={styles.pendingText}>
      <Text style={[styles.pendingTitle, { color: Colors.success }]}>✓ Chat Accepted</Text>
      <Text style={styles.pendingSub}>Seller: <Text style={{ color: Colors.text, fontWeight: '700' }}>{meta.sellerName}</Text></Text>
      <Text style={styles.pendingSub}>{meta.sellerCollege}</Text>
    </View>
    <View style={[styles.statusDot, { backgroundColor: Colors.success }]} />
  </View>
);

const TypingIndicator = () => (
  <View style={[styles.bubbleRow, styles.bubbleRowOther]}>
    <View style={[styles.bubble, styles.bubbleOther, { paddingVertical: 10, paddingHorizontal: 16 }]}>
      <Text style={{ color: Colors.textMuted, fontSize: 20, letterSpacing: 2 }}>•••</Text>
    </View>
  </View>
);

export const ChatRoomScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ChatRoom'>>();
  const { chatId, listingTitle } = route.params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [userId, setUserId] = useState('');
  const [showRating, setShowRating] = useState(false);
  const [chatMeta, setChatMeta] = useState<ChatMeta>({
    id: chatId,
    status: 'pending',
    listingTitle,
    listingImage: '',
  });

  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('token');
        if (userStr) {
          const user = JSON.parse(userStr);
          setUserId(user.id);
        }

        // Connect socket
        const socket = io(SOCKET_URL, {
          auth: { token },
          transports: ['websocket'],
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          socket.emit('join_chat', { chatId });
        });

        socket.on('new_message', (msg: Message) => {
          setMessages(prev => [...prev, msg]);
          scrollToBottom();
        });

        socket.on('typing', () => {
          setTyping(true);
          if (typingTimeout.current) clearTimeout(typingTimeout.current);
          typingTimeout.current = setTimeout(() => setTyping(false), 2000);
        });

        socket.on('chat_accepted', (data) => {
          setChatMeta(prev => ({
            ...prev,
            status: 'accepted',
            sellerName: data.sellerName,
            sellerCollege: data.sellerCollege,
            sellerId: data.sellerId,
          }));
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            senderId: 'system',
            text: '🎉 Seller accepted! You can now chat freely.',
            createdAt: new Date().toISOString(),
            type: 'system',
          }]);
        });

        // Load existing messages
        const response = await fetch(
          `${SOCKET_URL}/api/chats/${chatId}/messages`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        }

        // Load chat meta
        const chatResponse = await fetch(
          `${SOCKET_URL}/api/chats/${chatId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (chatResponse.ok) {
          const data = await chatResponse.json();
          setChatMeta(prev => ({
            ...prev,
            status: data.chat.status,
            sellerId: data.chat.seller_id,
            sellerName: data.sellerInfo?.anonymous_handle,
            sellerCollege: data.sellerInfo?.college,
          }));
        }
      } catch (err) {
        console.error('Chat init error:', err);
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      socketRef.current?.emit('leave_chat', { chatId });
      socketRef.current?.disconnect();
    };
  }, [chatId]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || chatMeta.status === 'pending') return;
    setInput('');
    socketRef.current?.emit('send_message', {
      chatId,
      text,
      senderId: userId,
    });
  };

  const handleInputChange = (text: string) => {
    setInput(text);
    socketRef.current?.emit('typing', { chatId, userId });
  };

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const prev = messages[index - 1];
    const showDate = !prev || formatDate(item.createdAt) !== formatDate(prev.createdAt);
    return (
      <>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>{formatDate(item.createdAt)}</Text>
          </View>
        )}
        <MessageBubble message={item} isOwn={item.senderId === userId} />
      </>
    );
  };

  const isPending = chatMeta.status === 'pending';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerMeta}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {chatMeta.status === 'accepted' ? chatMeta.sellerName : '🎭 Anonymous Seller'}
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>Re: {listingTitle}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: isPending ? Colors.warn + '22' : Colors.success + '22' }]}>
          <Text style={[styles.statusPillText, { color: isPending ? Colors.warn : Colors.success }]}>
            {isPending ? 'Pending' : 'Active'}
          </Text>
        </View>
      </View>

      {/* Status banner */}
      {chatMeta.status === 'pending'
        ? <PendingBanner listingTitle={listingTitle} />
        : (
          <>
            <AcceptedBanner meta={chatMeta} />
            <TouchableOpacity
              style={styles.rateBtn}
              onPress={() => setShowRating(true)}
            >
              <Text style={styles.rateBtnText}>⭐ Rate this seller</Text>
            </TouchableOpacity>
          </>
        )
      }

      {/* Messages */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={scrollToBottom}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={typing ? <TypingIndicator /> : null}
        />
      )}

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.inputRow}>
          {isPending ? (
            <View style={styles.pendingInputBlock}>
              <Text style={styles.pendingInputText}>
                ⏳ Waiting for seller to accept before you can message
              </Text>
            </View>
          ) : (
            <>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={handleInputChange}
                placeholder="Type a message..."
                placeholderTextColor={Colors.textDim}
                multiline
                maxLength={1000}
              />
              <TouchableOpacity
                style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!input.trim()}
              >
                <Text style={styles.sendIcon}>➤</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Rating Modal */}
      <RatingModal
        visible={showRating}
        onClose={() => setShowRating(false)}
        toUserId={chatMeta.sellerId || ''}
        listingId={chatId}
        listingTitle={listingTitle}
        sellerHandle={chatMeta.sellerName || 'Seller'}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  backText: { color: Colors.text, fontSize: 22 },
  headerMeta: { flex: 1 },
  headerTitle: { fontWeight: '800', fontSize: 15, color: Colors.text },
  headerSub: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  statusPill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  pendingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    margin: 12, padding: 14, borderRadius: 14,
    backgroundColor: Colors.warn + '0F',
    borderWidth: 1, borderColor: Colors.warn + '33',
  },
  pendingIcon: { fontSize: 28 },
  pendingText: { flex: 1 },
  pendingTitle: { fontWeight: '800', fontSize: 14, color: Colors.warn },
  pendingSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  sellerAvatarSmall: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.card,
    alignItems: 'center', justifyContent: 'center',
  },
  rateBtn: {
    marginHorizontal: 12, marginBottom: 8,
    backgroundColor: Colors.warn + '15',
    borderRadius: 12, borderWidth: 1,
    borderColor: Colors.warn + '44',
    paddingVertical: 10, alignItems: 'center',
  },
  rateBtnText: { color: Colors.warn, fontWeight: '700', fontSize: 13 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messageList: { paddingHorizontal: 14, paddingVertical: 10, paddingBottom: 20 },
  dateSeparator: { alignItems: 'center', marginVertical: 12 },
  dateSeparatorText: {
    fontSize: 11, color: Colors.textDim, fontWeight: '600',
    backgroundColor: Colors.card, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10,
  },
  systemMsgWrap: { alignItems: 'center', marginVertical: 8 },
  systemMsg: {
    fontSize: 12, color: Colors.textMuted, textAlign: 'center',
    backgroundColor: Colors.card, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 12, maxWidth: '80%', lineHeight: 18,
  },
  bubbleRow: { marginVertical: 3, flexDirection: 'row' },
  bubbleRowOwn: { justifyContent: 'flex-end' },
  bubbleRowOther: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '75%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleOwn: { backgroundColor: Colors.accent, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, color: Colors.textMuted, lineHeight: 20 },
  bubbleTextOwn: { color: '#fff' },
  bubbleTime: { fontSize: 10, color: Colors.textDim, marginTop: 4, textAlign: 'right' },
  bubbleTimeOwn: { color: 'rgba(255,255,255,0.6)' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  input: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 16, paddingVertical: 10,
    color: Colors.text, fontSize: 14, maxHeight: 100,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.accentDim },
  sendIcon: { color: '#fff', fontSize: 16 },
  pendingInputBlock: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    padding: 14, alignItems: 'center',
  },
  pendingInputText: { color: Colors.textMuted, fontSize: 13, textAlign: 'center' },
});