import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  ActivityIndicator, Image, Modal, Alert, Keyboard,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../../theme/ThemeProvider';
import { uploadLocalImage } from '../../utils/chatUpload';
import { useKeyboardPadding } from '../../utils/useKeyboardPadding';

const SOCKET_URL = 'https://campus-backend-arfy.onrender.com';

interface GroupMessage {
  id: string; senderId: string; senderHandle: string;
  text: string; imageUrl?: string | null; createdAt: string;
}

type RootStackParamList = {
  GroupChat: { groupId: string; groupName: string; groupIcon: string };
};

const softShadow = {
  shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
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

const GroupMessageBubble = ({ message, isOwn, onImagePress }: {
  message: GroupMessage; isOwn: boolean; onImagePress: (uri: string) => void;
}) => {
  const Colors = useColors();
  const s = useMemo(() => StyleSheet.create({
    bubbleRow: { marginVertical: 2, flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
    bubbleRowOwn: { justifyContent: 'flex-end' },
    bubbleRowOther: { justifyContent: 'flex-start' },
    msgAvatar: { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    msgAvatarText: { fontSize: 10, fontWeight: '700', color: '#fff' },
    bubble: { maxWidth: '72%', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 18 },
    bubbleWithImage: { padding: 5 },
    bubbleImage: { width: 200, height: 200, borderRadius: 14 },
    bubbleOwn: { backgroundColor: Colors.accent, borderBottomRightRadius: 4 },
    bubbleOther: { backgroundColor: Colors.card, borderBottomLeftRadius: 4, ...softShadow },
    senderName: { fontSize: 10.5, fontWeight: '700', color: Colors.accent, marginBottom: 3 },
    bubbleText: { fontSize: 13.5, color: Colors.text, lineHeight: 19 },
    bubbleTextOwn: { color: '#fff' },
    bubbleTime: { fontSize: 10, color: Colors.textDim, marginTop: 3, textAlign: 'right' },
    bubbleTimeOwn: { color: 'rgba(255,255,255,0.6)' },
  }), [Colors]);

  return (
    <View style={[s.bubbleRow, isOwn ? s.bubbleRowOwn : s.bubbleRowOther]}>
      {!isOwn && (
        <LinearGradient colors={[Colors.accent, Colors.accentAlt]} style={s.msgAvatar}>
          <Text style={s.msgAvatarText}>{message.senderHandle.slice(0, 2).toUpperCase()}</Text>
        </LinearGradient>
      )}
      <View style={[s.bubble, isOwn ? s.bubbleOwn : s.bubbleOther, message.imageUrl ? s.bubbleWithImage : null]}>
        {!isOwn && <Text style={s.senderName}>{message.senderHandle}</Text>}
        {message.imageUrl ? (
          <TouchableOpacity onPress={() => onImagePress(message.imageUrl!)} activeOpacity={0.9}>
            <Image source={{ uri: message.imageUrl }} style={s.bubbleImage} resizeMode="cover" />
          </TouchableOpacity>
        ) : null}
        {!!message.text && (
          <Text style={[s.bubbleText, isOwn && s.bubbleTextOwn, message.imageUrl ? { marginTop: 6 } : null]}>
            {message.text}
          </Text>
        )}
        <Text style={[s.bubbleTime, isOwn && s.bubbleTimeOwn]}>{formatTime(message.createdAt)}</Text>
      </View>
    </View>
  );
};

export const GroupChatScreen = () => {
  const Colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'GroupChat'>>();
  const { groupId, groupName, groupIcon } = route.params;
  const { rootRef, onLayout, pad } = useKeyboardPadding();

  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState('');
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<Socket | null>(null);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerIconWrap: { width: 34, height: 34, borderRadius: 11, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', ...softShadow },
    headerIcon: { fontSize: 18 },
    headerMeta: { flex: 1 },
    headerTitle: { fontWeight: '800', fontSize: 14.5, color: Colors.text },
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    messageList: { paddingHorizontal: 14, paddingVertical: 10, paddingBottom: 20 },
    empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 60, fontSize: 13 },
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
        socket.on('connect', () => { socket.emit('join_group', { groupId }); });
        socket.on('new_group_message', (msg: GroupMessage) => {
          if (msg && (msg as any).groupId && String((msg as any).groupId) !== String(groupId)) return;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
          scrollToBottom();
        });
        const response = await fetch(`${SOCKET_URL}/api/groups/${groupId}/messages`, { headers: { Authorization: `Bearer ${token}` } });
        if (response.ok) { const data = await response.json(); setMessages(data.messages || []); }
      } catch (err) { console.error('Group chat init error:', err); }
      finally { setLoading(false); }
    };
    init();
    return () => { socketRef.current?.emit('leave_group', { groupId }); socketRef.current?.disconnect(); };
  }, [groupId, scrollToBottom]);

  // Keep the newest message in view when the keyboard opens
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', scrollToBottom);
    return () => sub.remove();
  }, [scrollToBottom]);

  const handleSend = async () => {
    const text = input.trim();
    if ((!text && !pendingImage) || sending) return;

    // Text only: send straight away
    if (!pendingImage) {
      setInput('');
      socketRef.current?.emit('send_group_message', { groupId, text, senderId: userId, imageUrl: null });
      return;
    }

    // With a photo: upload it first, because the server only accepts https links
    try {
      setSending(true);
      const uploaded = await uploadLocalImage(pendingImage);
      socketRef.current?.emit('send_group_message', { groupId, text, senderId: userId, imageUrl: uploaded.url });
      setInput('');
      setPendingImage(null);
    } catch (e: any) {
      Alert.alert('Could not send the photo', e?.message ?? 'Please try again.');
    } finally {
      setSending(false);
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

  const renderItem = ({ item, index }: { item: GroupMessage; index: number }) => {
    const prev = messages[index - 1];
    const showDate = !prev || formatDate(item.createdAt) !== formatDate(prev.createdAt);
    return (
      <>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>{formatDate(item.createdAt)}</Text>
          </View>
        )}
        <GroupMessageBubble message={item} isOwn={item.senderId === userId} onImagePress={setViewerImage} />
      </>
    );
  };

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
          <View style={styles.headerIconWrap}>
            <Text style={styles.headerIcon}>{groupIcon}</Text>
          </View>
          <View style={styles.headerMeta}>
            <Text style={styles.headerTitle} numberOfLines={1}>{groupName}</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}><ActivityIndicator color={Colors.accent} /></View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={scrollToBottom}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<Text style={styles.empty}>No messages yet. Say hi!</Text>}
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
          <TouchableOpacity style={styles.attachBtn} onPress={handlePickImage} accessibilityRole="button" accessibilityLabel="Choose a photo">
            <Ionicons name="image-outline" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.attachBtn} onPress={handleCamera} accessibilityRole="button" accessibilityLabel="Take a photo">
            <Ionicons name="camera-outline" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textDim}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel="Send"
          >
            {sending ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={17} color="#fff" />}
          </TouchableOpacity>
        </View>
      </View>

      <ImageViewerModal visible={!!viewerImage} uri={viewerImage} onClose={() => setViewerImage(null)} />
    </View>
  );
};