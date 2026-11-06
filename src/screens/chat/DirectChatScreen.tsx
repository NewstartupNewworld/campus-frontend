import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, Image, ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../../theme/ThemeProvider';
import { uploadLocalImage } from '../../utils/chatUpload';
import { useKeyboardPadding } from '../../utils/useKeyboardPadding';

const API_URL = 'https://campus-backend-arfy.onrender.com';
const POLL_MS = 4000;

type Msg = { id: string; mine: boolean; body: string; imageUrl: string | null; createdAt: string };

const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const merge = (prev: Msg[], incoming: Msg[]) => {
  if (incoming.length === 0) return prev;
  const seen = new Set(prev.map((m) => m.id));
  const fresh = incoming.filter((m) => !seen.has(m.id));
  return fresh.length > 0 ? [...prev, ...fresh] : prev;
};

export default function DirectChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isFocused = useIsFocused();
  const chatId: string = route.params?.chatId;
  const { rootRef, onLayout, pad } = useKeyboardPadding();

  const [handle, setHandle] = useState<string>(route.params?.handle ?? 'Student');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<Msg>>(null);
  const lastId = useRef<string | null>(null);

  const load = useCallback(
    async (initial: boolean) => {
      try {
        const token = await AsyncStorage.getItem('token');
        const after = !initial && lastId.current ? `?after=${lastId.current}` : '';
        const res = await fetch(`${API_URL}/api/dm/${chatId}/messages${after}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (data.other?.handle) setHandle(data.other.handle);
        const incoming: Msg[] = data.messages ?? [];
        if (incoming.length > 0) {
          setMessages((prev) => merge(prev, incoming));
          lastId.current = incoming[incoming.length - 1].id;
        }
      } catch {
        // Keep what is on screen, the next refresh tries again
      } finally {
        if (initial) setLoading(false);
      }
    },
    [chatId]
  );

  useEffect(() => {
    load(true);
  }, [load]);

  useEffect(() => {
    if (!isFocused) return;
    const id = setInterval(() => load(false), POLL_MS);
    return () => clearInterval(id);
  }, [isFocused, load]);

  const post = async (body: string, imageUrl: string | null) => {
    const token = await AsyncStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/dm/${chatId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ body, imageUrl }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Could not send');
    setMessages((prev) => merge(prev, [data.message as Msg]));
  };

  const sendText = async () => {
    const body = input.trim();
    if (!body || sending) return;
    setSending(true);
    setInput('');
    try {
      await post(body, null);
    } catch (e: any) {
      setInput(body);
      Alert.alert('Could not send', e?.message ?? 'Please try again.');
    } finally {
      setSending(false);
    }
  };

  const sendPhoto = async () => {
    if (sending) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to send a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (result.canceled || result.assets.length === 0) return;
    try {
      setSending(true);
      const uploaded = await uploadLocalImage(result.assets[0].uri);
      await post('', uploaded.url);
    } catch (e: any) {
      Alert.alert('Could not send the photo', e?.message ?? 'Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <View
      ref={rootRef}
      collapsable={false}
      onLayout={onLayout}
      style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <View style={{ flex: 1, paddingBottom: pad > 0 ? pad : insets.bottom }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
            accessibilityRole="button" accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#2F54EB', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>{handle.slice(0, 2).toUpperCase()}</Text>
          </View>
          <Text style={{ flex: 1, color: colors.text, fontSize: 16, fontWeight: '800' }} numberOfLines={1}>{handle}</Text>
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 12, gap: 6 }}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', color: colors.textMuted, marginTop: 60, fontSize: 13 }}>
                No messages yet. Say hi!
              </Text>
            }
            renderItem={({ item }) => (
              <View style={{ flexDirection: 'row', justifyContent: item.mine ? 'flex-end' : 'flex-start' }}>
                <View
                  style={{
                    maxWidth: '78%', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8,
                    backgroundColor: item.mine ? colors.accent : colors.card,
                    borderBottomRightRadius: item.mine ? 4 : 18, borderBottomLeftRadius: item.mine ? 18 : 4,
                  }}
                >
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={{ width: 200, height: 200, borderRadius: 12, marginBottom: item.body ? 6 : 0 }} resizeMode="cover" />
                  ) : null}
                  {item.body ? (
                    <Text style={{ color: item.mine ? '#fff' : colors.text, fontSize: 14, lineHeight: 19 }}>{item.body}</Text>
                  ) : null}
                  <Text style={{ color: item.mine ? 'rgba(255,255,255,0.65)' : colors.textDim, fontSize: 10, marginTop: 3, textAlign: 'right' }}>
                    {timeLabel(item.createdAt)}
                  </Text>
                </View>
              </View>
            )}
          />
        )}

        {/* Input */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.card }}>
          <TouchableOpacity
            onPress={sendPhoto}
            disabled={sending}
            style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}
            accessibilityRole="button" accessibilityLabel="Send a photo"
          >
            <Ionicons name="image-outline" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.textDim}
            multiline
            maxLength={1000}
            style={{ flex: 1, backgroundColor: colors.bg, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 11, color: colors.text, fontSize: 14, maxHeight: 110 }}
          />
          <TouchableOpacity
            onPress={sendText}
            disabled={!input.trim() || sending}
            style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', opacity: !input.trim() || sending ? 0.5 : 1 }}
            accessibilityRole="button" accessibilityLabel="Send"
          >
            {sending ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}