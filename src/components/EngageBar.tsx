import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, FlatList, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../theme/ThemeProvider';
import { useKeyboardPadding } from '../utils/useKeyboardPadding';
import { API_URL, EMPTY_SUMMARY, EngageSummary, REACTIONS } from '../utils/engage';

type CommentItem = { id: string; text: string; author: string; mine: boolean; createdAt: string };

const timeAgo = (iso: string) => {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (isNaN(m) || m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

function CommentsModal({
  visible, onClose, targetType, targetId, onCount,
}: {
  visible: boolean; onClose: () => void; targetType: string; targetId: string; onCount: (n: number) => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { rootRef, onLayout, pad } = useKeyboardPadding({ modal: true });
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(
        `${API_URL}/api/engage/comments?type=${encodeURIComponent(targetType)}&id=${encodeURIComponent(targetId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setComments(data.comments ?? []);
      onCount((data.comments ?? []).length);
    } catch {
      Alert.alert('Could not load', 'Check your internet and try again.');
    } finally {
      setLoading(false);
    }
  }, [targetType, targetId, onCount]);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    try {
      setSending(true);
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/engage/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: targetType, id: targetId, text: body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not post');
      setComments((prev) => {
        const next = [...prev, data.comment];
        onCount(next.length);
        return next;
      });
      setText('');
    } catch (e: any) {
      Alert.alert('Could not post', e?.message ?? 'Please try again.');
    } finally {
      setSending(false);
    }
  };

  const remove = (item: CommentItem) => {
    Alert.alert('Delete comment?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/engage/comments/${item.id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('failed');
            setComments((prev) => {
              const next = prev.filter((c) => c.id !== item.id);
              onCount(next.length);
              return next;
            });
          } catch {
            Alert.alert('Could not delete', 'Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <View ref={rootRef} collapsable={false} onLayout={onLayout} style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: pad }}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)' }}
        />
        <View
          style={{
            backgroundColor: colors.card, borderTopLeftRadius: 22, borderTopRightRadius: 22,
            paddingHorizontal: 14, paddingBottom: 12 + (pad > 0 ? 0 : insets.bottom), maxHeight: '80%',
          }}
        >
          <View style={{ width: 36, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginVertical: 12 }} />
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16, marginBottom: 10 }}>
            Comments ({comments.length})
          </Text>

          {loading ? (
            <ActivityIndicator color={colors.accent} style={{ marginVertical: 24 }} />
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(c) => c.id}
              style={{ flexGrow: 0, flexShrink: 1, maxHeight: 320 }}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={{ color: colors.textMuted, textAlign: 'center', paddingVertical: 24, fontSize: 13 }}>
                  No comments yet. Be first!
                </Text>
              }
              renderItem={({ item }) => (
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                  <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="person" size={15} color={colors.textMuted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 12, marginBottom: 2 }}>{item.author}</Text>
                    <Text style={{ color: colors.text, fontSize: 13.5, lineHeight: 19 }}>{item.text}</Text>
                    <Text style={{ color: colors.textDim, fontSize: 10, marginTop: 3 }}>{timeAgo(item.createdAt)}</Text>
                  </View>
                  {item.mine ? (
                    <TouchableOpacity
                      onPress={() => remove(item)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      accessibilityRole="button"
                      accessibilityLabel="Delete comment"
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}
            />
          )}

          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 8 }}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Add a comment..."
              placeholderTextColor={colors.textDim}
              multiline
              maxLength={500}
              style={{ flex: 1, backgroundColor: colors.bg, borderRadius: 23, paddingHorizontal: 16, paddingVertical: 12, minHeight: 46, color: colors.text, fontSize: 14.5, maxHeight: 110 }}
            />
            <TouchableOpacity
              onPress={send}
              disabled={!text.trim() || sending}
              accessibilityRole="button"
              accessibilityLabel="Send comment"
              style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', opacity: !text.trim() || sending ? 0.5 : 1 }}
            >
              {sending ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={18} color="#fff" />}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Reactions plus a comments button for any post.
 * targetType is one of: confession, event, club, lostfound, roommate.
 * Pass `summary` from fetchEngageSummary so the counts show right away.
 */
export default function EngageBar({
  targetType, targetId, summary,
}: {
  targetType: string; targetId: string; summary?: EngageSummary;
}) {
  const colors = useColors();
  const [data, setData] = useState<EngageSummary>(summary ?? EMPTY_SUMMARY);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (summary) setData(summary);
  }, [summary]);

  const change = (emoji: string, add: boolean) =>
    setData((prev) => ({
      ...prev,
      mine: add ? [...prev.mine.filter((e) => e !== emoji), emoji] : prev.mine.filter((e) => e !== emoji),
      reactions: { ...prev.reactions, [emoji]: Math.max(0, (prev.reactions[emoji] ?? 0) + (add ? 1 : -1)) },
    }));

  const react = async (emoji: string) => {
    const add = !data.mine.includes(emoji);
    change(emoji, add);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/engage/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: targetType, id: targetId, emoji }),
      });
      if (!res.ok) throw new Error('failed');
    } catch {
      change(emoji, !add);
    }
  };

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
      {REACTIONS.map((emoji) => {
        const active = data.mine.includes(emoji);
        const count = data.reactions[emoji] ?? 0;
        return (
          <TouchableOpacity
            key={emoji}
            onPress={() => react(emoji)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 34, paddingHorizontal: 10,
              borderRadius: 17, backgroundColor: active ? colors.accent + '28' : colors.cardAlt,
            }}
          >
            <Text style={{ fontSize: 14 }}>{emoji}</Text>
            {count > 0 ? (
              <Text style={{ color: active ? colors.accent : colors.textMuted, fontSize: 12, fontWeight: '700' }}>{count}</Text>
            ) : null}
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Open comments"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 34, paddingHorizontal: 10, borderRadius: 17, backgroundColor: colors.cardAlt }}
      >
        <Ionicons name="chatbubble-outline" size={15} color={colors.textMuted} />
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>{data.comments}</Text>
      </TouchableOpacity>

      <CommentsModal
        visible={open}
        onClose={() => setOpen(false)}
        targetType={targetType}
        targetId={targetId}
        onCount={(n) => setData((prev) => ({ ...prev, comments: n }))}
      />
    </View>
  );
}