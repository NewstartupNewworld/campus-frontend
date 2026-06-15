import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView,
  ActivityIndicator, Image, Modal, Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../theme/colors';

const SOCKET_URL = 'https://campus-backend-production-2dbb.up.railway.app';

interface GroupMessage {
  id: string;
  senderId: string;
  senderHandle: string;
  text: string;
  imageUrl?: string | null;
  createdAt: string;
}

type RootStackParamList = {
  GroupChat: { groupId: string; groupName: string; groupIcon: string };
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

const ImageViewerModal = ({ visible, uri, onClose }: { visible: boolean; uri: string | null; onClose: () => void }) => {
  if (!uri) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={iv.overlay} activeOpacity={1} onPress={onClose}>
        <Image source={{ uri }} style={iv.image} resizeMode="contain" />
        <TouchableOpacity style={iv.closeBtn} onPress={onClose}>
          <Text style={iv.closeText}>✕</Text>
        </TouchableOpacity>
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

const GroupMessageBubble = ({ message, isOwn, onImagePress }: { message: GroupMessage; isOwn: boolean; onImagePress: (uri: string) => void }) => {
  return (
    <View style={[styles.bubbleRow, isOwn ? styles.bubbleRowOwn : styles.bubbleRowOther]}>
      {!isOwn && (
        <LinearGradient colors={[Colors.accent, Colors.accentAlt]} style={styles.msgAvatar}>
          <Text style={styles.msgAvatarText}>{message.senderHandle.slice(0, 2).toUpperCase()}</Text>
        </LinearGradient>
      )}
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther, message.imageUrl && styles.bubbleWithImage]}>
        {!isOwn && <Text style={styles.senderName}>{message.senderHandle}</Text>}
        {message.imageUrl && (
          <TouchableOpacity onPress={() => onImagePress(message.imageUrl!)} activeOpacity={0.9}>
            <Image source={{ uri: message.imageUrl }} style={styles.bubbleImage} resizeMode="cover" />
          </TouchableOpacity>
        )}
        {!!message.text && (
          <Text style={[styles.bubbleText, isOwn && styles.bubbleTextOwn, message.imageUrl && { marginTop: 6 }]}>{message.text}</Text>
        )}
        <Text style={[styles.bubbleTime, isOwn && styles.bubbleTimeOwn]}>{formatTime(message.createdAt)}</Text>
      </View>
    </View>
  );
};

export const GroupChatScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'GroupChat'>>();
  const { groupId, groupName, groupIcon } = route.params;

  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('token');
        if (userStr) {
          const user = JSON.parse(userStr);
          setUserId(user.id);
        }

        const socket = io(SOCKET_URL, {
          auth: { token },
          transports: ['websocket'],
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          socket.emit('join_group', { groupId });
        });

        socket.on('new_group_message', (msg: GroupMessage) => {
          setMessages(prev => [...prev, msg]);
          scrollToBottom();
        });

        const response = await fetch(`${SOCKET_URL}/api/groups/${groupId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error('Group chat init error:', err);
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      socketRef.current?.emit('leave_group', { groupId });
      socketRef.current?.disconnect();
    };
  }, [groupId]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const handleSend = () => {
    const text = input.trim();
    if (!text && !pendingImage) return;
    setInput('');
    const imageToSend = pendingImage;
    setPendingImage(null);
    socketRef.current?.emit('send_group_message', {
      groupId,
      text,
      senderId: userId,
      imageUrl: imageToSend,
    });
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPendingImage(result.assets[0].uri);
    }
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPendingImage(result.assets[0].uri);
    }
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerIcon}>{groupIcon}</Text>
        <View style={styles.headerMeta}>
          <Text style={styles.headerTitle} numberOfLines={1}>{groupName}</Text>
        </View>
      </View>

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
          ListEmptyComponent={<Text style={styles.empty}>No messages yet. Say hi! 👋</Text>}
        />
      )}

      {pendingImage && (
        <View style={styles.pendingImageWrap}>
          <Image source={{ uri: pendingImage }} style={styles.pendingImagePreview} resizeMode="cover" />
          <TouchableOpacity style={styles.removePendingImage} onPress={() => setPendingImage(null)}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.attachBtn} onPress={handlePickImage}>
            <Text style={styles.attachIcon}>🖼️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.attachBtn} onPress={handleCamera}>
            <Text style={styles.attachIcon}>📷</Text>
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
            style={[styles.sendBtn, !input.trim() && !pendingImage && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim() && !pendingImage}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <ImageViewerModal visible={!!viewerImage} uri={viewerImage} onClose={() => setViewerImage(null)} />
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
  headerIcon: { fontSize: 22 },
  headerMeta: { flex: 1 },
  headerTitle: { fontWeight: '800', fontSize: 15, color: Colors.text },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messageList: { paddingHorizontal: 14, paddingVertical: 10, paddingBottom: 20 },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 60, fontSize: 13 },
  dateSeparator: { alignItems: 'center', marginVertical: 12 },
  dateSeparatorText: {
    fontSize: 11, color: Colors.textDim, fontWeight: '600',
    backgroundColor: Colors.card, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10,
  },
  bubbleRow: { marginVertical: 3, flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  bubbleRowOwn: { justifyContent: 'flex-end' },
  bubbleRowOther: { justifyContent: 'flex-start' },
  msgAvatar: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  msgAvatarText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  bubble: { maxWidth: '72%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleWithImage: { padding: 6 },
  bubbleImage: { width: 200, height: 200, borderRadius: 12 },
  bubbleOwn: { backgroundColor: Colors.accent, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: 4 },
  senderName: { fontSize: 11, fontWeight: '700', color: Colors.accent, marginBottom: 3 },
  bubbleText: { fontSize: 14, color: Colors.textMuted, lineHeight: 20 },
  bubbleTextOwn: { color: '#fff' },
  bubbleTime: { fontSize: 10, color: Colors.textDim, marginTop: 4, textAlign: 'right' },
  bubbleTimeOwn: { color: 'rgba(255,255,255,0.6)' },
  pendingImageWrap: { position: 'relative', marginHorizontal: 14, marginBottom: 8 },
  pendingImagePreview: { width: 100, height: 100, borderRadius: 12 },
  removePendingImage: { position: 'absolute', top: -6, right: -6, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  attachBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  attachIcon: { fontSize: 16 },
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
});