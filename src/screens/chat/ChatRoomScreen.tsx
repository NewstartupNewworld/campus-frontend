import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  ActivityIndicator, Image, Modal, Alert, Keyboard,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../../theme/ThemeProvider';
import { RatingModal } from '../../components/RatingModal';
import { uploadLocalImage } from '../../utils/chatUpload';
import { useKeyboardPadding } from '../../utils/useKeyboardPadding';

const SOCKET_URL = 'https://campus-backend-arfy.onrender.com';

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
        <TouchableOpacity style={iv.closeBtn} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close photo">
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};
const iv = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: '80%' },
  closeBtn: { position: 'absolute', top: 50, right: 20, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
});

const MessageBubble = ({ message, isOwn, onImagePress, onRespondOffer }: {
  message: Message; isOwn: boolean;
  onImagePress: (uri: string) => void;
  onRespondOffer: (messageId: string, status: 'accepted' | 'rejected') => void;
}) => {
  const Colors = useColors();
  const s = useMemo(() => StyleSheet.create({
    bubbleRow: { marginVertical: 2, flexDirection: 'row' },
    bubbleRowOwn: { justifyContent: 'flex-end' },
    bubbleRowOther: { justifyContent: 'flex-start' },
    bubble: { maxWidth: '75%', paddingHorizontal: 13, paddingVertical: 9, borderRadius: 18 },
    bubbleWithImage: { padding: 5 },
    bubbleImage: { width: 200, height: 200, borderRadius: 14 },
    bubbleOwn: { backgroundColor: Colors.accent, borderBottomRightRadius: 4 },
    bubbleOther: { backgroundColor: Colors.card, borderBottomLeftRadius: 4, ...softShadow },
    bubbleText: { fontSize: 13.5, color: Colors.text, lineHeight: 19 },
    bubbleTextOwn: { color: '#fff' },
    metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 3 },
    bubbleTime: { fontSize: 10, color: Colors.textDim },
    bubbleTimeOwn: { color: 'rgba(255,255,255,0.6)' },
    systemMsgWrap: { alignItems: 'center', marginVertical: 8 },
    systemMsg: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', backgroundColor: Colors.card, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, maxWidth: '80%', lineHeight: 17, ...softShadow },
    offerCard: { minWidth: 180, maxWidth: '75%', backgroundColor: Colors.card, borderRadius: 18, padding: 16, alignItems: 'center', marginVertical: 4, ...cardShadow },
    offerLabel: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
    offerAmount: { fontSize: 28, fontWeight: '900', color: Colors.text, marginTop: 4, marginBottom: 12 },
    offerBtnRow: { flexDirection: 'row', gap: 8, width: '100%' },
    offerBtn: { flex: 1, borderRadius: 12, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4 },
    offerAccept: { backgroundColor: Colors.success + '25' },
    offerReject: { backgroundColor: Colors.danger + '20' },
    offerBtnTextAccept: { color: Colors.success, fontWeight: '700', fontSize: 12 },
    offerBtnTextReject: { color: Colors.danger, fontWeight: '700', fontSize: 12 },
    offerStatusBadge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 5 },
    offerStatusText: { fontWeight: '700', fontSize: 12 },
    offerTime: { fontSize: 10, color: Colors.textDim, marginTop: 8 },
  }), [Colors]);

  if (message.type === 'system') {
    return <View style={s.systemMsgWrap}><Text style={s.systemMsg}>{message.text}</Text></View>;
  }

  if (message.offerAmount) {
    const statusColor = message.offerStatus === 'accepted' ? Colors.success : message.offerStatus === 'rejected' ? Colors.danger : Colors.warn;
    const statusIcon = message.offerStatus === 'accepted' ? 'checkmark-circle' : message.offerStatus === 'rejected' ? 'close-circle' : 'time';
    const statusLabel = message.offerStatus === 'accepted' ? 'Accepted' : message.offerStatus === 'rejected' ? 'Rejected' : 'Pending';
    return (
      <View style={[s.bubbleRow, isOwn ? s.bubbleRowOwn : s.bubbleRowOther]}>
        <View style={s.offerCard}>
          <Text style={s.offerLabel}>{isOwn ? 'Your Offer' : 'Price Offer'}</Text>
          <Text style={s.offerAmount}>{'\u20B9'}{message.offerAmount}</Text>
          {message.offerStatus === 'pending' && !isOwn ? (
            <View style={s.offerBtnRow}>
              <TouchableOpacity style={[s.offerBtn, s.offerAccept]} onPress={() => onRespondOffer(message.id, 'accepted')} accessibilityRole="button" accessibilityLabel="Accept offer">
                <Ionicons name="checkmark" size={14} color={Colors.success} />
                <Text style={s.offerBtnTextAccept}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.offerBtn, s.offerReject]} onPress={() => onRespondOffer(message.id, 'rejected')} accessibilityRole="button" accessibilityLabel="Reject offer">
                <Ionicons name="close" size={14} color={Colors.danger} />
                <Text style={s.offerBtnTextReject}>Reject</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[s.offerStatusBadge, { backgroundColor: statusColor + '20' }]}>
              <Ionicons name={statusIcon} size={13} color={statusColor} />
              <Text style={[s.offerStatusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          )}
          <Text style={s.offerTime}>{formatTime(message.createdAt)}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.bubbleRow, isOwn ? s.bubbleRowOwn : s.bubbleRowOther]}>
      <View style={[s.bubble, isOwn ? s.bubbleOwn : s.bubbleOther, message.imageUrl ? s.bubbleWithImage : null]}>
        {message.imageUrl ? (
          <TouchableOpacity onPress={() => onImagePress(message.imageUrl!)} activeOpacity={0.9}>
            <Image source={{ uri: message.imageUrl }} style={s.bubbleImage} resizeMode="cover" />
          </TouchableOpacity>
        ) : null}
        {!!message.text && (
          <Text style={[s.bubbleText, isOwn && s.bubbleTextOwn, message.imageUrl ? { marginTop: 6 } : null]}>{message.text}</Text>
        )}
        <View style={s.metaRow}>
          <Text style={[s.bubbleTime, isOwn && s.bubbleTimeOwn]}>{formatTime(message.createdAt)}</Text>
          {isOwn ? (
            <Ionicons
              name={message.read ? 'checkmark-done' : 'checkmark'}
              size={13}
              color={message.read ? '#BFD4FF' : 'rgba(255,255,255,0.6)'}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
};

// Pending banner
const PendingBanner = ({ listingTitle }: { listingTitle: string }) => {
  const Colors = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 14, marginTop: 10, marginBottom: 6, padding: 14, borderRadius: 16, backgroundColor: Colors.warn + '12', ...softShadow }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.warn + '22', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="eye-off-outline" size={18} color={Colors.warn} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '800', fontSize: 13.5, color: Colors.warn }}>Chat Request Pending</Text>
        <Text style={{ fontSize: 11.5, color: Colors.textMuted, marginTop: 2 }}>Re: <Text style={{ color: Colors.text }}>{listingTitle}</Text></Text>
        <Text style={{ fontSize: 11.5, color: Colors.textMuted, marginTop: 1 }}>Seller identity hidden until they accept.</Text>
      </View>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.warn }} />
    </View>
  );
};

// Accepted banner
const AcceptedBanner = ({ meta }: { meta: ChatMeta }) => {
  const Colors = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 14, marginTop: 10, marginBottom: 6, padding: 14, borderRadius: 16, backgroundColor: Colors.success + '12', ...softShadow }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.success + '22', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="person" size={17} color={Colors.success} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
          <Text style={{ fontWeight: '800', fontSize: 13.5, color: Colors.success }}>Chat Accepted</Text>
        </View>
        <Text style={{ fontSize: 11.5, color: Colors.textMuted, marginTop: 2 }}>Seller: <Text style={{ color: Colors.text, fontWeight: '700' }}>{meta.sellerName}</Text></Text>
        {meta.sellerCollege ? <Text style={{ fontSize: 11.5, color: Colors.textMuted, marginTop: 1 }}>{meta.sellerCollege}</Text> : null}
      </View>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success }} />
    </View>
  );
};

// Typing indicator
const TypingIndicator = () => {
  const Colors = useColors();
  return (
    <View style={{ marginVertical: 2, flexDirection: 'row', justifyContent: 'flex-start' }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 18, borderBottomLeftRadius: 4, backgroundColor: Colors.card, ...softShadow }}>
        <Text style={{ color: Colors.textMuted, fontSize: 18, letterSpacing: 3 }}>...</Text>
      </View>
    </View>
  );
};

export const ChatRoomScreen = () => {
  const Colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ChatRoom'>>();
  const { chatId, listingTitle } = route.params;
  const isFocused = useIsFocused();
  const { rootRef, onLayout, pad } = useKeyboardPadding();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
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
  const lastTypingEmit = useRef(0);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerMeta: { flex: 1 },
    headerTitle: { fontWeight: '800', fontSize: 14.5, color: Colors.text },
    headerSub: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
    statusPill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    statusPillText: { fontSize: 11, fontWeight: '700' },
    acceptBtn: { marginHorizontal: 14, marginBottom: 8, backgroundColor: Colors.success, borderRadius: 14, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, ...softShadow },
    acceptBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
    rateBtn: { marginHorizontal: 14, marginBottom: 8, backgroundColor: Colors.warn + '18', borderRadius: 14, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
    rateBtnText: { color: Colors.warn, fontWeight: '700', fontSize: 13 },
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    messageList: { paddingHorizontal: 14, paddingVertical: 10, paddingBottom: 20 },
    dateSeparator: { alignItems: 'center', marginVertical: 10 },
    dateSeparatorText: { fontSize: 11, color: Colors.textDim, fontWeight: '600', backgroundColor: Colors.card, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, ...softShadow },
    pendingImageWrap: { position: 'relative', marginHorizontal: 14, marginBottom: 8, alignSelf: 'flex-start' },
    pendingImagePreview: { width: 90, height: 90, borderRadius: 14 },
    removePendingImage: { position: 'absolute', top: -6, right: -6, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 12, width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
    inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 7, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: Colors.card, ...softShadow },
    attachBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
    input: { flex: 1, backgroundColor: Colors.bg, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, color: Colors.text, fontSize: 13.5, maxHeight: 100 },
    sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', ...softShadow },
    sendBtnDisabled: { backgroundColor: Colors.accentDim },
    pendingInputBlock: { flex: 1, backgroundColor: Colors.bg, borderRadius: 14, padding: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
    pendingInputText: { color: Colors.textMuted, fontSize: 12.5, textAlign: 'center' },
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
  }), [Colors]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

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
        socket.on('new_message', (msg: Message) => {
          setMessages(prev => (prev.some(m => m.id === msg.id) ? prev : [...prev, msg]));
          scrollToBottom();
          socket.emit('mark_read', { chatId, userId: userStr ? JSON.parse(userStr).id : '' });
        });
        socket.on('messages_read', ({ readBy }: { readBy: string }) => { setMessages(prev => prev.map(m => m.senderId !== readBy ? { ...m, read: true } : m)); });
        socket.on('offer_updated', ({ messageId, status }: { messageId: string; status: string }) => { setMessages(prev => prev.map(m => m.id === messageId ? { ...m, offerStatus: status } : m)); });
        socket.on('typing', () => { setTyping(true); if (typingTimeout.current) clearTimeout(typingTimeout.current); typingTimeout.current = setTimeout(() => setTyping(false), 2000); });
        socket.on('chat_accepted', (data) => {
          setChatMeta(prev => ({ ...prev, status: 'accepted', sellerName: data.sellerName, sellerCollege: data.sellerCollege, sellerId: data.sellerId }));
          setMessages(prev => [...prev, { id: Date.now().toString(), senderId: 'system', text: 'Seller accepted! You can now chat freely.', createdAt: new Date().toISOString(), type: 'system' }]);
        });
        const response = await fetch(`${SOCKET_URL}/api/chats/${chatId}/messages`, { headers: { Authorization: `Bearer ${token}` } });
        if (response.ok) { const data = await response.json(); setMessages(data.messages || []); }
        const chatResponse = await fetch(`${SOCKET_URL}/api/chats/${chatId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (chatResponse.ok) { const data = await chatResponse.json(); setChatMeta(prev => ({ ...prev, status: data.chat.status, sellerId: data.chat.seller_id, sellerName: data.sellerInfo?.anonymous_handle, sellerCollege: data.sellerInfo?.college })); }
      } catch (err) { console.error('Chat init error:', err); }
      finally { setLoading(false); }
    };
    init();
    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      socketRef.current?.emit('leave_chat', { chatId });
      socketRef.current?.disconnect();
    };
  }, [chatId, scrollToBottom]);

  useEffect(() => {
    if (isFocused && userId && socketRef.current) { socketRef.current.emit('mark_read', { chatId, userId }); }
  }, [isFocused, userId, chatId]);

  // Keep the newest message in view when the keyboard opens
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', scrollToBottom);
    return () => sub.remove();
  }, [scrollToBottom]);

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
    if ((!text && !pendingImage) || chatMeta.status === 'pending' || sending) return;

    // Text only: send straight away
    if (!pendingImage) {
      setInput('');
      socketRef.current?.emit('send_message', { chatId, text, senderId: userId, imageUrl: null });
      return;
    }

    // With a photo: upload it first, because the server only accepts https links
    try {
      setSending(true);
      const uploaded = await uploadLocalImage(pendingImage);
      socketRef.current?.emit('send_message', { chatId, text, senderId: userId, imageUrl: uploaded.url });
      setInput('');
      setPendingImage(null);
    } catch (e: any) {
      Alert.alert('Could not send the photo', e?.message ?? 'Please try again.');
    } finally {
      setSending(false);
    }
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

  const handleInputChange = (text: string) => {
    setInput(text);
    const now = Date.now();
    if (now - lastTypingEmit.current > 1500) {
      lastTypingEmit.current = now;
      socketRef.current?.emit('typing', { chatId, userId });
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow access to your photo library.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 0.7 });
    if (!result.canceled && result.assets[0]) setPendingImage(result.assets[0].uri);
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow camera access.'); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.7 });
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
  const canSend = (!!input.trim() || !!pendingImage) && !sending;

  return (
    <View
      ref={rootRef}
      collapsable={false}
      onLayout={onLayout}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={{ flex: 1, paddingBottom: pad }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerMeta}>
            <Text style={styles.headerTitle} numberOfLines={1}>{chatMeta.status === 'accepted' ? chatMeta.sellerName : 'Anonymous Seller'}</Text>
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
              <TouchableOpacity style={styles.acceptBtn} onPress={handleAcceptChat} disabled={accepting} accessibilityRole="button" accessibilityLabel="Accept chat request">
                {accepting ? <ActivityIndicator color="#fff" size="small" /> : (
                  <>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                    <Text style={styles.acceptBtnText}>Accept Chat Request</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            <AcceptedBanner meta={chatMeta} />
            <TouchableOpacity style={styles.rateBtn} onPress={() => setShowRating(true)} accessibilityRole="button" accessibilityLabel="Rate this seller">
              <Ionicons name="star" size={14} color={Colors.warn} />
              <Text style={styles.rateBtnText}>Rate this seller</Text>
            </TouchableOpacity>
          </>
        )}

        {loading ? (
          <View style={styles.loadingWrap}><ActivityIndicator color={Colors.accent} /></View>
        ) : (
          <FlatList
            ref={flatListRef} data={messages} renderItem={renderItem} keyExtractor={item => item.id}
            contentContainerStyle={styles.messageList} onContentSizeChange={scrollToBottom}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ListFooterComponent={typing ? <TypingIndicator /> : null}
          />
        )}

        {pendingImage ? (
          <View style={styles.pendingImageWrap}>
            <Image source={{ uri: pendingImage }} style={styles.pendingImagePreview} resizeMode="cover" />
            <TouchableOpacity style={styles.removePendingImage} onPress={() => setPendingImage(null)} accessibilityRole="button" accessibilityLabel="Remove photo">
              <Ionicons name="close" size={13} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.inputRow}>
          {isPending ? (
            <View style={styles.pendingInputBlock}>
              <Ionicons name="time-outline" size={15} color={Colors.textMuted} />
              <Text style={styles.pendingInputText}>Waiting for seller to accept</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity style={styles.attachBtn} onPress={handlePickImage} accessibilityRole="button" accessibilityLabel="Choose a photo">
                <Ionicons name="image-outline" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.attachBtn} onPress={handleCamera} accessibilityRole="button" accessibilityLabel="Take a photo">
                <Ionicons name="camera-outline" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.attachBtn} onPress={() => setOfferModalVisible(true)} accessibilityRole="button" accessibilityLabel="Make a price offer">
                <Ionicons name="cash-outline" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
              <TextInput style={styles.input} value={input} onChangeText={handleInputChange} placeholder="Type a message..." placeholderTextColor={Colors.textDim} multiline maxLength={1000} />
              <TouchableOpacity
                style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!canSend}
                accessibilityRole="button"
                accessibilityLabel="Send"
              >
                {sending ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={17} color="#fff" />}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <RatingModal visible={showRating} onClose={() => setShowRating(false)} toUserId={chatMeta.sellerId || ''} listingId={chatId} listingTitle={listingTitle} sellerHandle={chatMeta.sellerName || 'Seller'} />
      <ImageViewerModal visible={!!viewerImage} uri={viewerImage} onClose={() => setViewerImage(null)} />

      <Modal visible={offerModalVisible} transparent animationType="fade" onRequestClose={() => setOfferModalVisible(false)}>
        <View style={styles.offerModalOverlay}>
          <View style={styles.offerModalCard}>
            <Text style={styles.offerModalTitle}>Make a Price Offer</Text>
            <Text style={styles.offerModalSub}>Suggest a price for this item</Text>
            <View style={styles.offerInputRow}>
              <Text style={styles.offerInputPrefix}>{'\u20B9'}</Text>
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
    </View>
  );
};