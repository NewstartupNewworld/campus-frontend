import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView,
  ActivityIndicator, Image, Modal, Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';
import * as ImagePicker from 'expo-image-picker';
import { useColors } from '../../theme/ThemeProvider';
import { RatingModal } from '../../components/RatingModal';

const SOCKET_URL = 'https://campus-backend-production-2dbb.up.railway.app';

type ChatStatus = 'pending' | 'accepted' | 'rejected';

interface Message {
  id: string; senderId: string; text: string; imageUrl?: string | null;
  read?: boolean; offerAmount?: number | null; offerStatus?: string | null;
  createdAt: string; type: 'text' | 'system';
}

interface ChatMeta {
  id: string; status: ChatStatus; listingTitle: string; listingImage: string;
  sellerName?: string; sellerCollege?: string; sellerId?: string;
}

type RootStackParamList = { ChatRoom: { chatId: string; listingTitle: string } };

const softShadow = {
  shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
};
const cardShadow = {
  shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.18, shadowRadius: 10, elevation: 5,
};

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const formatDate = (iso: string) => {
  const d = new Date(iso); const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
};

const ImageViewerModal = ({ visible, uri, onClose }: { visible: boolean; uri: string | null; onClose: () => void }) => {
  if (!uri) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={iv.overlay} activeOpacity={1} onPress={onClose}>
        <Image source={{ uri }} style={iv.image} resizeMode="contain" />
        <TouchableOpacity style={iv.closeBtn} onPress={onClose}><Text style={iv.closeText}>✕</Text></TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};
const iv = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: '80%' },
  closeBtn: { position: 'absolute', top: 50, right: 20, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});

const MessageBubble = ({ message, isOwn, onImagePress, onRespondOffer }: {
  message: Message; isOwn: boolean;
  onImagePress: (uri: string) => void;
  onRespondOffer: (messageId: string, status: 'accepted' | 'rejected') => void;
}) => {
  const Colors = useColors();
  const s = StyleSheet.create({
    bubbleRow: { marginVertical: 2, flexDirection: 'row' },
    bubbleRowOwn: { justifyContent: 'flex-end' },
    bubbleRowOther: { justifyContent: 'flex-start' },

    // Own bubble — accent fill, no border
    bubble: { maxWidth: '75%', paddingHorizontal: 13, paddingVertical: 9, borderRadius: 18 },
    bubbleWithImage: { padding: 5 },
    bubbleImage: { width: 200, height: 200, borderRadius: 14 },
    bubbleOwn: { backgroundColor: Colors.accent, borderBottomRightRadius: 4 },
    // Other bubble — card bg, shadow instead of border
    bubbleOther: { backgroundColor: Colors.card, borderBottomLeftRadius: 4, ...softShadow },
    bubbleText: { fontSize: 13.5, color: Colors.text, lineHeight: 19 },
    bubbleTextOwn: { color: '#fff' },
    bubbleTime: { fontSize: 10, color: Colors.textDim, marginTop: 3, textAlign: 'right' },
    bubbleTimeOwn: { color: 'rgba(255,255,255,0.6)' },

    // System message — centered pill
    systemMsgWrap: { alignItems: 'center', marginVertical: 8 },
    systemMsg: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', backgroundColor: Colors.card, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, maxWidth: '80%', lineHeight: 17, ...softShadow },

    // Offer card — shadow, no border except status tint
    offerCard: { minWidth: 180, maxWidth: '75%', backgroundColor: Colors.card, borderRadius: 18, padding: 16, alignItems: 'center', marginVertical: 4, ...cardShadow },
    offerLabel: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
    offerAmount: { fontSize: 28, fontWeight: '900', color: Colors.text, marginTop: 4, marginBottom: 12 },
    offerBtnRow: { flexDirection: 'row', gap: 8, width: '100%' },
    offerBtn: { flex: 1, borderRadius: 12, paddingVertical: 8, alignItems: 'center' },
    offerAccept: { backgroundColor: Colors.success + '25' },
    offerReject: { backgroundColor: Colors.danger + '20' },
    offerBtnTextAccept: { color: Colors.success, fontWeight: '700', fontSize: 12 },
    offerBtnTextReject: { color: Colors.danger, fontWeight: '700', fontSize: 12 },
    offerStatusBadge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
    offerStatusText: { fontWeight: '700', fontSize: 12 },
    offerTime: { fontSize: 10, color: Colors.textDim, marginTop: 8 },
  });

  if (message.type === 'system') {
    return <View style={s.systemMsgWrap}><Text style={s.systemMsg}>{message.text}</Text></View>;
  }

  if (message.offerAmount) {
    const statusColor = message.offerStatus === 'accepted' ? Colors.success : message.offerStatus === 'rejected' ? Colors.danger : Colors.warn;
    return (
      <View style={[s.bubbleRow, isOwn ? s.bubbleRowOwn : s.bubbleRowOther]}>
        <View style={s.offerCard}>
          <Text style={s.offerLabel}>{isOwn ? 'Your Offer' : 'Price Offer'}</Text>
          <Text style={s.offerAmount}>₹{message.offerAmount}</Text>
          {message.offerStatus === 'pending' && !isOwn ? (
            <View style={s.offerBtnRow}>
              <TouchableOpacity style={[s.offerBtn, s.offerAccept]} onPress={() => onRespondOffer(message.id, 'accepted')}>
                <Text style={s.offerBtnTextAccept}>✓ Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.offerBtn, s.offerReject]} onPress={() => onRespondOffer(message.id, 'rejected')}>
                <Text style={s.offerBtnTextReject}>✕ Reject</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[s.offerStatusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[s.offerStatusText, { color: statusColor }]}>
                {message.offerStatus === 'accepted' ? '✓ Accepted' : message.offerStatus === 'rejected' ? '✕ Rejected' : '⏳ Pending'}
              </Text>
            </View>
          )}
          <Text style={s.offerTime}>{formatTime(message.createdAt)}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.bubbleRow, isOwn ? s.bubbleRowOwn : s.bubbleRowOther]}>
      <View style={[s.bubble, isOwn ? s.bubbleOwn : s.bubbleOther, message.imageUrl && s.bubbleWithImage]}>
        {message.imageUrl && (
          <TouchableOpacity onPress={() => onImagePress(message.imageUrl!)} activeOpacity={0.9}>
            <Image source={{ uri: message.imageUrl }} style={s.bubbleImage} resizeMode="cover" />
          </TouchableOpacity>
        )}
        {!!message.text && <Text style={[s.bubbleText, isOwn && s.bubbleTextOwn, message.imageUrl && { marginTop: 6 }]}>{message.text}</Text>}
        <Text style={[s.bubbleTime, isOwn && s.bubbleTimeOwn]}>
          {formatTime(message.createdAt)}{isOwn && (message.read ? '  ✓✓' : '  ✓')}
        </Text>
      </View>
    </View>
  );
};

// Pending banner — warm tinted card, shadow
const PendingBanner = ({ listingTitle }: { listingTitle: string }) => {
  const Colors = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 14, marginTop: 10, marginBottom: 6, padding: 14, borderRadius: 16, backgroundColor: Colors.warn + '12', ...softShadow }}>
      <Text style={{ fontSize: 26 }}>🎭</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '800', fontSize: 13.5, color: Colors.warn }}>Chat Request Pending</Text>
        <Text style={{ fontSize: 11.5, color: Colors.textMuted, marginTop: 2 }}>Re: <Text style={{ color: Colors.text }}>{listingTitle}</Text></Text>
        <Text style={{ fontSize: 11.5, color: Colors.textMuted, marginTop: 1 }}>Seller identity hidden until they accept.</Text>
      </View>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.warn }} />
    </View>
  );
};

// Accepted banner — success tinted, shadow
const AcceptedBanner = ({ meta }: { meta: ChatMeta }) => {
  const Colors = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 14, marginTop: 10, marginBottom: 6, padding: 14, borderRadius: 16, backgroundColor: Colors.success + '12', ...softShadow }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.success + '22', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 16 }}>👤</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '800', fontSize: 13.5, color: Colors.success }}>✓ Chat Accepted</Text>
        <Text style={{ fontSize: 11.5, color: Colors.textMuted, marginTop: 2 }}>Seller: <Text style={{ color: Colors.text, fontWeight: '700' }}>{meta.sellerName}</Text></Text>
        {meta.sellerCollege && <Text style={{ fontSize: 11.5, color: Colors.textMuted, marginTop: 1 }}>{meta.sellerCollege}</Text>}
      </View>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success }} />
    </View>
  );
};

// Typing indicator — shadow bubble
const TypingIndicator = () => {
  const Colors = useColors();
  return (
    <View style={{ marginVertical: 2, flexDirection: 'row', justifyContent: 'flex-start' }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 18, borderBottomLeftRadius: 4, backgroundColor: Colors.card, ...softShadow }}>
        <Text style={{ color: Colors.textMuted, fontSize: 18, letterSpacing: 3 }}>•••</Text>
      </View>
    </View>
  );
};

export const ChatRoomScreen = () => {
  const Colors = useColors();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ChatRoom'>>();
  const { chatId, listingTitle } = route.params;
  const isFocused = useIsFocused();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [userId, setUserId] = useState('');
  const [showRating, setShowRating] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [chatMeta, setChatMeta] = useState<ChatMeta>({ id: chatId, status: 'pending', listingTitle, listingImage: '' });

  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },

    // Header — hairline divider, no heavy border
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
    backBtn: { padding: 4 },
    backText: { color: Colors.text, fontSize: 22 },
    headerMeta: { flex: 1 },
    headerTitle: { fontWeight: '800', fontSize: 14.5, color: Colors.text },
    headerSub: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
    statusPill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    statusPillText: { fontSize: 11, fontWeight: '700' },

    // Accept / rate buttons — shadow, no border
    acceptBtn: { marginHorizontal: 14, marginBottom: 8, backgroundColor: Colors.success, borderRadius: 14, paddingVertical: 13, alignItems: 'center', ...softShadow },
    acceptBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
    rateBtn: { marginHorizontal: 14, marginBottom: 8, backgroundColor: Colors.warn + '18', borderRadius: 14, paddingVertical: 10, alignItems: 'center' },
    rateBtnText: { color: Colors.warn, fontWeight: '700', fontSize: 13 },

    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    messageList: { paddingHorizontal: 14, paddingVertical: 10, paddingBottom: 20 },

    // Date separator pill
    dateSeparator: { alignItems: 'center', marginVertical: 10 },
    dateSeparatorText: { fontSize: 11, color: Colors.textDim, fontWeight: '600', backgroundColor: Colors.card, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, ...softShadow },

    // Pending image preview
    pendingImageWrap: { position: 'relative', marginHorizontal: 14, marginBottom: 8 },
    pendingImagePreview: { width: 90, height: 90, borderRadius: 14 },
    removePendingImage: { position: 'absolute', top: -6, right: -6, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 12, width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },

    // Input row — shadow bar, no top border
    inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 7, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: Colors.card, ...softShadow },
    attachBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
    attachIcon: { fontSize: 15 },
    input: { flex: 1, backgroundColor: Colors.bg, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, color: Colors.text, fontSize: 13.5, maxHeight: 100 },
    sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', ...softShadow },
    sendBtnDisabled: { backgroundColor: Colors.accentDim },
    sendIcon: { color: '#fff', fontSize: 15 },
    pendingInputBlock: { flex: 1, backgroundColor: Colors.bg, borderRadius: 14, padding: 13, alignItems: 'center' },
    pendingInputText: { color: Colors.textMuted, fontSize: 12.5, textAlign: 'center' },

    // Offer modal — shadow, no border
    offerModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
    offerModalCard: { backgroundColor: Colors.card, borderRadius: 20, padding: 24, width: '85%', ...cardShadow },
    offerModalTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: 4 },
    offerModalSub: { fontSize: 12.5, color: Colors.textMuted, marginBottom: 16 },
    offerInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg, borderRadius: 14, paddingHorizontal: 14, marginBottom: 16 },
    offerInputPrefix: { fontSize: 18, fontWeight: '800', color: Colors.accent, marginRight: 6 },
    offerInput: { flex: 1, color: Colors.text, fontSize: 18, fontWeight: '700', paddingVertical: 12 },
    offerModalBtns: { flexDirection: 'row', gap: 12 },
    offerModalCancel: { flex: 1, backgroundColor: Colors.bg, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    offerModalCancelText: { color: Colors.text, fontWeight: '700' },
    offerModalSend: { flex: 1, backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 12, alignItems: 'center', ...softShadow },
    offerModalSendText: { color: '#fff', fontWeight: '800' },
  });

  useEffect(() => {
    const init = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('token');
        if (userStr) { const user = JSON.parse(userStr); setUserId(user.id); }
        const socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket'] });
        socketRef.current = socket;
        socket.on('connect', () => {
          socket.emit('join_chat', { chatId });
          socket.emit('mark_read', { chatId, userId: userStr ? JSON.parse(userStr).id : '' });
        });
        socket.on('new_message', (msg: Message) => { setMessages(prev => [...prev, msg]); scrollToBottom(); socket.emit('mark_read', { chatId, userId: userStr ? JSON.parse(userStr).id : '' }); });
        socket.on('messages_read', ({ readBy }: { readBy: string }) => { setMessages(prev => prev.map(m => m.senderId !== readBy ? { ...m, read: true } : m)); });
        socket.on('offer_updated', ({ messageId, status }: { messageId: string; status: string }) => { setMessages(prev => prev.map(m => m.id === messageId ? { ...m, offerStatus: status } : m)); });
        socket.on('typing', () => { setTyping(true); if (typingTimeout.current) clearTimeout(typingTimeout.current); typingTimeout.current = setTimeout(() => setTyping(false), 2000); });
        socket.on('chat_accepted', (data) => {
          setChatMeta(prev => ({ ...prev, status: 'accepted', sellerName: data.sellerName, sellerCollege: data.sellerCollege, sellerId: data.sellerId }));
          setMessages(prev => [...prev, { id: Date.now().toString(), senderId: 'system', text: '🎉 Seller accepted! You can now chat freely.', createdAt: new Date().toISOString(), type: 'system' }]);
        });
        const response = await fetch(`${SOCKET_URL}/api/chats/${chatId}/messages`, { headers: { Authorization: `Bearer ${token}` } });
        if (response.ok) { const data = await response.json(); setMessages(data.messages || []); }
        const chatResponse = await fetch(`${SOCKET_URL}/api/chats/${chatId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (chatResponse.ok) { const data = await chatResponse.json(); setChatMeta(prev => ({ ...prev, status: data.chat.status, sellerId: data.chat.seller_id, sellerName: data.sellerInfo?.anonymous_handle, sellerCollege: data.sellerInfo?.college })); }
      } catch (err) { console.error('Chat init error:', err); }
      finally { setLoading(false); }
    };
    init();
    return () => { socketRef.current?.emit('leave_chat', { chatId }); socketRef.current?.disconnect(); };
  }, [chatId]);

  useEffect(() => { if (isFocused && userId && socketRef.current) { socketRef.current.emit('mark_read', { chatId, userId }); } }, [isFocused, userId]);

  const scrollToBottom = useCallback(() => { setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100); }, []);

  const handleAcceptChat = async () => {
    setAccepting(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${SOCKET_URL}/api/chats/${chatId}/accept`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) { setChatMeta(prev => ({ ...prev, status: 'accepted' })); socketRef.current?.emit('chat_accepted_broadcast', { chatId }); }
      else { Alert.alert('Error', 'Failed to accept chat.'); }
    } catch (e) { Alert.alert('Error', 'Failed to accept chat. Check your connection.'); }
    finally { setAccepting(false); }
  };

  const handleSend = async () => {
    const text = input.trim();
    if ((!text && !pendingImage) || chatMeta.status === 'pending') return;
    setInput(''); const imageToSend = pendingImage; setPendingImage(null);
    socketRef.current?.emit('send_message', { chatId, text, senderId: userId, imageUrl: imageToSend });
  };

  const handleSendOffer = () => {
    const amount = Number(offerAmount);
    if (!amount || amount <= 0) return;
    socketRef.current?.emit('send_message', { chatId, text: '', senderId: userId, offerAmount: amount });
    setOfferAmount(''); setOfferModalVisible(false);
  };

  const handleRespondOffer = (messageId: string, status: 'accepted' | 'rejected') => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, offerStatus: status } : m));
    socketRef.current?.emit('respond_offer', { chatId, messageId, status });
  };

  const handleInputChange = (text: string) => { setInput(text); socketRef.current?.emit('typing', { chatId, userId }); };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow access to your photo library.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.8 });
    if (!result.canceled && result.assets[0]) setPendingImage(result.assets[0].uri);
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow camera access.'); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.8 });
    if (!result.canceled && result.assets[0]) setPendingImage(result.assets[0].uri);
  };

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const prev = messages[index - 1];
    const showDate = !prev || formatDate(item.createdAt) !== formatDate(prev.createdAt);
    return (
      <>
        {showDate && <View style={styles.dateSeparator}><Text style={styles.dateSeparatorText}>{formatDate(item.createdAt)}</Text></View>}
        <MessageBubble message={item} isOwn={item.senderId === userId} onImagePress={setViewerImage} onRespondOffer={handleRespondOffer} />
      </>
    );
  };

  const isPending = chatMeta.status === 'pending';
  const isSeller = !!(userId && chatMeta.sellerId && userId === chatMeta.sellerId);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerMeta}>
          <Text style={styles.headerTitle} numberOfLines={1}>{chatMeta.status === 'accepted' ? chatMeta.sellerName : '🎭 Anonymous Seller'}</Text>
          <Text style={styles.headerSub} numberOfLines={1}>Re: {listingTitle}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: isPending ? Colors.warn + '22' : Colors.success + '22' }]}>
          <Text style={[styles.statusPillText, { color: isPending ? Colors.warn : Colors.success }]}>{isPending ? 'Pending' : 'Active'}</Text>
        </View>
      </View>

      {chatMeta.status === 'pending' ? (
        <>
          <PendingBanner listingTitle={listingTitle} />
          {isSeller && (
            <TouchableOpacity style={styles.acceptBtn} onPress={handleAcceptChat} disabled={accepting}>
              {accepting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.acceptBtnText}>✓ Accept Chat Request</Text>}
            </TouchableOpacity>
          )}
        </>
      ) : (
        <>
          <AcceptedBanner meta={chatMeta} />
          <TouchableOpacity style={styles.rateBtn} onPress={() => setShowRating(true)}>
            <Text style={styles.rateBtnText}>⭐ Rate this seller</Text>
          </TouchableOpacity>
        </>
      )}

      {loading ? (
        <View style={styles.loadingWrap}><ActivityIndicator color={Colors.accent} /></View>
      ) : (
        <FlatList
          ref={flatListRef} data={messages} renderItem={renderItem} keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList} onContentSizeChange={scrollToBottom}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={typing ? <TypingIndicator /> : null}
        />
      )}

      {pendingImage && (
        <View style={styles.pendingImageWrap}>
          <Image source={{ uri: pendingImage }} style={styles.pendingImagePreview} resizeMode="cover" />
          <TouchableOpacity style={styles.removePendingImage} onPress={() => setPendingImage(null)}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 11 }}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.inputRow}>
          {isPending ? (
            <View style={styles.pendingInputBlock}>
              <Text style={styles.pendingInputText}>⏳ Waiting for seller to accept</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity style={styles.attachBtn} onPress={handlePickImage}><Text style={styles.attachIcon}>🖼️</Text></TouchableOpacity>
              <TouchableOpacity style={styles.attachBtn} onPress={handleCamera}><Text style={styles.attachIcon}>📷</Text></TouchableOpacity>
              <TouchableOpacity style={styles.attachBtn} onPress={() => setOfferModalVisible(true)}><Text style={styles.attachIcon}>💰</Text></TouchableOpacity>
              <TextInput style={styles.input} value={input} onChangeText={handleInputChange} placeholder="Type a message..." placeholderTextColor={Colors.textDim} multiline maxLength={1000} />
              <TouchableOpacity style={[styles.sendBtn, !input.trim() && !pendingImage && styles.sendBtnDisabled]} onPress={handleSend} disabled={!input.trim() && !pendingImage}>
                <Text style={styles.sendIcon}>➤</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>

      <RatingModal visible={showRating} onClose={() => setShowRating(false)} toUserId={chatMeta.sellerId || ''} listingId={chatId} listingTitle={listingTitle} sellerHandle={chatMeta.sellerName || 'Seller'} />
      <ImageViewerModal visible={!!viewerImage} uri={viewerImage} onClose={() => setViewerImage(null)} />

      <Modal visible={offerModalVisible} transparent animationType="fade" onRequestClose={() => setOfferModalVisible(false)}>
        <View style={styles.offerModalOverlay}>
          <View style={styles.offerModalCard}>
            <Text style={styles.offerModalTitle}>Make a Price Offer</Text>
            <Text style={styles.offerModalSub}>Suggest a price for this item</Text>
            <View style={styles.offerInputRow}>
              <Text style={styles.offerInputPrefix}>₹</Text>
              <TextInput style={styles.offerInput} value={offerAmount} onChangeText={setOfferAmount} keyboardType="numeric" placeholder="Amount" placeholderTextColor={Colors.textDim} autoFocus />
            </View>
            <View style={styles.offerModalBtns}>
              <TouchableOpacity style={styles.offerModalCancel} onPress={() => setOfferModalVisible(false)}>
                <Text style={styles.offerModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.offerModalSend, !offerAmount && { opacity: 0.5 }]} onPress={handleSendOffer} disabled={!offerAmount}>
                <Text style={styles.offerModalSendText}>Send Offer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};