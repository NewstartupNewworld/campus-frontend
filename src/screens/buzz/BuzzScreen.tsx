import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, RefreshControl, Image,
  KeyboardAvoidingView, Platform, Modal, Alert, ActivityIndicator, Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../theme/colors';

const API_URL = 'https://campus-backend-production-2dbb.up.railway.app';

type PostCategory = 'All' | 'Meme' | 'Event' | 'Food' | 'Lost & Found' | 'Rant' | 'News';

interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

interface BuzzPost {
  id: string;
  author: string;
  category: PostCategory;
  content: string;
  image?: string;
  reactions: { emoji: string; count: number; reacted: boolean }[];
  comments: Comment[];
  comment_count?: number;
  createdAt: string;
  trending: boolean;
  saved?: boolean;
}

const CATEGORIES: PostCategory[] = ['All', 'Meme', 'Event', 'Food', 'Lost & Found', 'Rant', 'News'];

const CATEGORY_COLORS: Record<string, string> = {
  Meme: '#FFB347', Event: '#4F8CFF', Food: '#3DDC84',
  'Lost & Found': '#FF5C5C', Rant: '#C97BFF', News: '#00C9FF',
};

const DEFAULT_REACTIONS = [
  { emoji: '🔥', count: 0, reacted: false },
  { emoji: '❤️', count: 0, reacted: false },
  { emoji: '😂', count: 0, reacted: false },
];

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// ─── Full-screen image viewer ──────────────────────────────────────────────

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

// ─── Comment Sheet ──────────────────────────────────────────────────────────

const CommentSheet = ({
  post, visible, onClose, onAddComment,
}: {
  post: BuzzPost | null;
  visible: boolean;
  onClose: () => void;
  onAddComment: (postId: string, text: string) => void;
}) => {
  const [text, setText] = useState('');
  if (!post) return null;

  const handleSend = () => {
    if (!text.trim()) return;
    onAddComment(post.id, text.trim());
    setText('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={cs.overlay}>
        <TouchableOpacity style={cs.backdrop} onPress={onClose} />
        <KeyboardAvoidingView
          behavior="padding"
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
          style={cs.kavContainer}
        >
          <View style={cs.sheet}>
            <View style={cs.handle} />
            <Text style={cs.sheetTitle}>Comments ({post.comments.length})</Text>
            <FlatList
              data={post.comments}
              keyExtractor={c => c.id}
              style={cs.commentList}
              ListEmptyComponent={
                <Text style={cs.emptyComments}>No comments yet. Be first! 👇</Text>
              }
              renderItem={({ item }) => (
                <View style={cs.commentRow}>
                  <View style={cs.commentAvatar}>
                    <Text style={{ fontSize: 13 }}>👤</Text>
                  </View>
                  <View style={cs.commentBody}>
                    <Text style={cs.commentAuthor}>{item.author}</Text>
                    <Text style={cs.commentText}>{item.text}</Text>
                    <Text style={cs.commentTime}>{timeAgo(item.createdAt)}</Text>
                  </View>
                </View>
              )}
            />
            <View style={cs.inputRow}>
              <TextInput
                style={cs.input}
                value={text}
                onChangeText={setText}
                placeholder="Add a comment..."
                placeholderTextColor={Colors.textDim}
                multiline
                maxLength={300}
              />
              <TouchableOpacity
                style={[cs.sendBtn, !text.trim() && cs.sendBtnOff]}
                onPress={handleSend}
                disabled={!text.trim()}
              >
                <Text style={cs.sendIcon}>➤</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const cs = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
  kavContainer: { width: '100%' },
  sheet: {
    backgroundColor: Colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 16, paddingBottom: 30, maxHeight: '85%',
    borderWidth: 1, borderBottomWidth: 0, borderColor: Colors.border,
  },
  handle: { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginVertical: 12 },
  sheetTitle: { fontWeight: '800', fontSize: 16, color: Colors.text, marginBottom: 12 },
  commentList: { flexGrow: 0, maxHeight: 320 },
  emptyComments: { color: Colors.textMuted, textAlign: 'center', paddingVertical: 24, fontSize: 13 },
  commentRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  commentBody: { flex: 1 },
  commentAuthor: { fontWeight: '700', fontSize: 12, color: Colors.accent, marginBottom: 2 },
  commentText: { fontSize: 13, color: Colors.text, lineHeight: 18 },
  commentTime: { fontSize: 10, color: Colors.textDim, marginTop: 3 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 12, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 },
  input: { flex: 1, backgroundColor: Colors.bg, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 9, color: Colors.text, fontSize: 13, maxHeight: 80 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  sendBtnOff: { backgroundColor: Colors.accentDim },
  sendIcon: { color: '#fff', fontSize: 15 },
});

// ─── Post Card ──────────────────────────────────────────────────────────────

const PostCard = ({
  post, currentUserHandle, onReact, onComment, onDelete, onImagePress, onSave,
}: {
  post: BuzzPost;
  currentUserHandle: string;
  onReact: (postId: string, emoji: string) => void;
  onComment: (post: BuzzPost) => void;
  onDelete: (postId: string) => void;
  onImagePress: (uri: string) => void;
  onSave: (postId: string) => void;
}) => {
  const catColor = CATEGORY_COLORS[post.category] ?? Colors.textMuted;
  const [showMenu, setShowMenu] = useState(false);
  const lastTap = React.useRef<number>(0);
  const heartScale = React.useRef(new Animated.Value(0)).current;

  const isOwner = post.author === currentUserHandle;

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      const fireReaction = post.reactions.find(r => r.emoji === '🔥');
      if (fireReaction && !fireReaction.reacted) {
        onReact(post.id, '🔥');
      }
      heartScale.setValue(0);
      Animated.sequence([
        Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, friction: 3 }),
        Animated.timing(heartScale, { toValue: 0, duration: 400, delay: 300, useNativeDriver: true }),
      ]).start();
    }
    lastTap.current = now;
  };

  return (
    <View style={ps.card}>
      <View style={ps.cardHeader}>
        <View style={ps.authorAvatar}><Text style={{ fontSize: 14 }}>👤</Text></View>
        <View style={ps.authorMeta}>
          <Text style={ps.authorName}>{post.author}</Text>
          <Text style={ps.postTime}>{timeAgo(post.createdAt)}</Text>
        </View>
        <View style={[ps.categoryBadge, { borderColor: catColor + '55', backgroundColor: catColor + '15' }]}>
          <Text style={[ps.categoryText, { color: catColor }]}>{post.category}</Text>
        </View>
        {post.trending && (
          <View style={ps.trendingBadge}>
            <Text style={ps.trendingText}>🔥 Hot</Text>
          </View>
        )}
        {isOwner && (
          <TouchableOpacity style={ps.menuBtn} onPress={() => setShowMenu(true)}>
            <Text style={ps.menuDots}>⋮</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity activeOpacity={1} onPress={handleDoubleTap}>
        <Text style={ps.content}>{post.content}</Text>
        {post.image && (
          <View>
            <TouchableOpacity activeOpacity={0.9} onPress={() => onImagePress(post.image!)} onLongPress={handleDoubleTap}>
              <Image source={{ uri: post.image }} style={ps.image} resizeMode="cover" />
            </TouchableOpacity>
            <Animated.View
              pointerEvents="none"
              style={[ps.heartOverlay, {
                opacity: heartScale,
                transform: [{ scale: heartScale.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.4] }) }],
              }]}
            >
              <Text style={ps.heartEmoji}>🔥</Text>
            </Animated.View>
          </View>
        )}
      </TouchableOpacity>

      <View style={ps.reactionsRow}>
        {post.reactions.map(r => (
          <TouchableOpacity
            key={r.emoji}
            style={[ps.reactionBtn, r.reacted && ps.reactionBtnActive]}
            onPress={() => onReact(post.id, r.emoji)}
            activeOpacity={0.75}
          >
            <Text style={ps.reactionEmoji}>{r.emoji}</Text>
            <Text style={[ps.reactionCount, r.reacted && { color: Colors.accent }]}>{r.count}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={ps.commentBtn} onPress={() => onComment(post)} activeOpacity={0.75}>
          <Text style={ps.commentBtnText}>💬 {post.comments.length || post.comment_count || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={ps.saveBtn} onPress={() => onSave(post.id)} activeOpacity={0.75}>
          <Text style={ps.saveIcon}>{post.saved ? '🔖' : '📑'}</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <TouchableOpacity style={ps.menuOverlay} activeOpacity={1} onPress={() => setShowMenu(false)}>
          <View style={ps.menuCard}>
            <TouchableOpacity
              style={ps.menuItem}
              onPress={() => {
                setShowMenu(false);
                Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => onDelete(post.id) },
                ]);
              }}
            >
              <Text style={ps.menuItemTextDanger}>🗑️ Delete Post</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const ps = StyleSheet.create({
  card: { backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, marginHorizontal: 14, marginBottom: 12, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 14, paddingBottom: 10 },
  authorAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  authorMeta: { flex: 1 },
  authorName: { fontWeight: '700', fontSize: 13, color: Colors.accent },
  postTime: { fontSize: 10, color: Colors.textDim, marginTop: 1 },
  categoryBadge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  categoryText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  trendingBadge: { backgroundColor: Colors.warn + '22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  trendingText: { fontSize: 10, fontWeight: '700', color: Colors.warn },
  content: { fontSize: 14, color: Colors.text, lineHeight: 22, paddingHorizontal: 14, paddingBottom: 12 },
  image: { width: '100%', height: 200 },
  reactionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.border, flexWrap: 'wrap' },
  reactionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.bg, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 10, paddingVertical: 5 },
  reactionBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '18' },
  reactionEmoji: { fontSize: 14 },
  reactionCount: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  commentBtn: { marginLeft: 'auto', backgroundColor: Colors.bg, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 5 },
  commentBtnText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  saveBtn: { backgroundColor: Colors.bg, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 10, paddingVertical: 5 },
  saveIcon: { fontSize: 14 },
  menuBtn: { padding: 4, marginLeft: 4 },
  menuDots: { fontSize: 20, color: Colors.textMuted, fontWeight: '900' },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  menuCard: { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, width: '70%', overflow: 'hidden' },
  menuItem: { paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center' },
  menuItemTextDanger: { color: Colors.danger, fontWeight: '700', fontSize: 15 },
  heartOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  heartEmoji: { fontSize: 80 },
});

// ─── Create Post Sheet ──────────────────────────────────────────────────────

const CreatePostSheet = ({
  visible, onClose, onPost,
}: {
  visible: boolean;
  onClose: () => void;
  onPost: (content: string, category: PostCategory, image?: string) => void;
}) => {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PostCategory>('Meme');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
      setSelectedImage(result.assets[0].uri);
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
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handlePost = () => {
    if (!content.trim()) return;
    onPost(content.trim(), category, selectedImage || undefined);
    setContent('');
    setCategory('Meme');
    setSelectedImage(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <TouchableOpacity
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' }}
          onPress={onClose}
        />
        <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}>
          <View style={cps.sheet}>
            <View style={cps.handle} />
            <Text style={cps.title}>New Buzz Post</Text>
            <Text style={cps.anon}>Posted anonymously</Text>

            <View style={cps.pills}>
              {(CATEGORIES.filter(c => c !== 'All') as PostCategory[]).map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[cps.pill, category === cat && { backgroundColor: (CATEGORY_COLORS[cat] ?? Colors.accent) + '22', borderColor: (CATEGORY_COLORS[cat] ?? Colors.accent) + '66' }]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[cps.pillText, category === cat && { color: CATEGORY_COLORS[cat] ?? Colors.accent }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={cps.input}
              value={content}
              onChangeText={setContent}
              placeholder="What's happening on campus?"
              placeholderTextColor={Colors.textDim}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={cps.charCount}>{content.length}/500</Text>

            {selectedImage && (
              <View style={cps.imagePreviewWrap}>
                <Image source={{ uri: selectedImage }} style={cps.imagePreview} resizeMode="cover" />
                <TouchableOpacity style={cps.removeImage} onPress={() => setSelectedImage(null)}>
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={cps.mediaRow}>
              <TouchableOpacity style={cps.mediaBtn} onPress={handleCamera}>
                <Text style={cps.mediaBtnText}>📷 Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={cps.mediaBtn} onPress={handlePickImage}>
                <Text style={cps.mediaBtnText}>🖼️ Gallery</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[cps.postBtn, !content.trim() && { opacity: 0.5 }]}
              onPress={handlePost}
              disabled={!content.trim()}
            >
              <Text style={cps.postBtnText}>⚡ Post to Buzz</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const cps = StyleSheet.create({
  sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 32, borderWidth: 1, borderBottomWidth: 0, borderColor: Colors.border },
  handle: { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { fontWeight: '800', fontSize: 18, color: Colors.text, marginBottom: 4 },
  anon: { fontSize: 12, color: Colors.textMuted, marginBottom: 14 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  pill: { backgroundColor: Colors.bg, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 6 },
  pillText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  input: { backgroundColor: Colors.bg, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 12, color: Colors.text, fontSize: 14, minHeight: 80 },
  charCount: { textAlign: 'right', fontSize: 11, color: Colors.textDim, marginTop: 4, marginBottom: 10 },
  imagePreviewWrap: { position: 'relative', marginBottom: 10 },
  imagePreview: { width: '100%', height: 160, borderRadius: 12 },
  removeImage: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  mediaRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  mediaBtn: { flex: 1, backgroundColor: Colors.bg, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingVertical: 10, alignItems: 'center' },
  mediaBtnText: { fontSize: 13, fontWeight: '700', color: Colors.text },
  postBtn: { backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  postBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

// ─── Main Screen ────────────────────────────────────────────────────────────

export const BuzzScreen = () => {
  const [posts, setPosts] = useState<BuzzPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<PostCategory>('All');
  const [commentPost, setCommentPost] = useState<BuzzPost | null>(null);
  const [createVisible, setCreateVisible] = useState(false);
  const [currentUserHandle, setCurrentUserHandle] = useState('');
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setCurrentUserHandle(user.anonymous_handle || '');
        }
      } catch (e) {}
    };
    loadUser();
  }, []);

  const fetchPosts = useCallback(async (category: PostCategory) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const url = category === 'All'
        ? `${API_URL}/api/buzz/feed`
        : `${API_URL}/api/buzz/feed?category=${encodeURIComponent(category)}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && data.posts) {
        const mapped: BuzzPost[] = data.posts.map((p: any) => ({
          id: p.id,
          author: p.author,
          category: p.category,
          content: p.content,
          image: p.image_url || undefined,
          reactions: DEFAULT_REACTIONS.map(r => ({ ...r })),
          comments: [],
          comment_count: parseInt(p.comment_count) || 0,
          createdAt: p.created_at,
          trending: parseInt(p.comment_count) > 5,
        }));
        setPosts(mapped);
      }
    } catch (e) {
      console.error('Fetch buzz error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchPosts(activeCategory);
  }, [activeCategory, fetchPosts]);

  const handleReact = async (postId: string, emoji: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        reactions: p.reactions.map(r =>
          r.emoji === emoji
            ? { ...r, count: r.reacted ? r.count - 1 : r.count + 1, reacted: !r.reacted }
            : r
        ),
      };
    }));
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(`${API_URL}/api/buzz/${postId}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ emoji }),
      });
    } catch (e) {
      console.error('React error:', e);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/buzz/${postId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
        method: 'GET',
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        const comments: Comment[] = data.map((c: any) => ({
          id: c.id,
          author: c.author,
          text: c.text,
          createdAt: c.created_at,
        }));
        setPosts(prev => {
          const updated = prev.map(p => p.id === postId ? { ...p, comments } : p);
          const updatedPost = updated.find(p => p.id === postId);
          if (updatedPost) setCommentPost(updatedPost);
          return updated;
        });
      }
    } catch (e) {
      // ignore
    }
  };

  const handleOpenComments = (post: BuzzPost) => {
    setCommentPost(post);
    fetchComments(post.id);
  };

  const handleAddComment = async (postId: string, text: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/buzz/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (response.ok) {
        const newComment: Comment = {
          id: data.id,
          author: data.author,
          text: data.text,
          createdAt: data.created_at,
        };
        setPosts(prev => {
          const updated = prev.map(p =>
            p.id === postId
              ? { ...p, comments: [...p.comments, newComment], comment_count: (p.comment_count || 0) + 1 }
              : p
          );
          const updatedPost = updated.find(p => p.id === postId);
          if (updatedPost) setCommentPost(updatedPost);
          return updated;
        });
      } else {
        Alert.alert('Error', data.error || 'Failed to add comment');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to add comment. Check your connection.');
    }
  };

  const handleCreatePost = async (content: string, category: PostCategory, image?: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/buzz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content, category, imageUrl: image || null }),
      });
      const data = await response.json();
      if (response.ok) {
        fetchPosts(activeCategory);
      } else {
        Alert.alert('Error', data.error || 'Failed to post');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to post. Check your connection.');
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/buzz/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId));
      } else {
        const data = await response.json();
        Alert.alert('Error', data.error || 'Failed to delete post');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to delete post. Check your connection.');
    }
  };

  const handleSavePost = async (postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, saved: !p.saved } : p));
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(`${API_URL}/api/buzz/${postId}/save`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.error('Save error:', e);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    fetchPosts(activeCategory);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>⚡ Buzz</Text>
          <Text style={styles.headerSub}>Anonymous campus feed</Text>
        </View>
        <TouchableOpacity style={styles.postBtn} onPress={() => setCreateVisible(true)}>
          <Text style={styles.postBtnText}>+ Post</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={i => i}
        contentContainerStyle={styles.categoriesContent}
        style={styles.categoriesRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.pill, activeCategory === item && styles.pillActive]}
            onPress={() => setActiveCategory(item as PostCategory)}
          >
            <Text style={[styles.pillText, activeCategory === item && styles.pillTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <ActivityIndicator color={Colors.accent} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={p => p.id}
          contentContainerStyle={styles.feed}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.accent} />}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              currentUserHandle={currentUserHandle}
              onReact={handleReact}
              onComment={handleOpenComments}
              onDelete={handleDeletePost}
              onImagePress={setViewerImage}
              onSave={handleSavePost}
            />
          )}
          ListEmptyComponent={<Text style={styles.empty}>No posts yet. Be the first to buzz! ⚡</Text>}
        />
      )}

      <CommentSheet
        post={commentPost}
        visible={!!commentPost}
        onClose={() => setCommentPost(null)}
        onAddComment={handleAddComment}
      />

      <CreatePostSheet
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onPost={handleCreatePost}
      />

      <ImageViewerModal
        visible={!!viewerImage}
        uri={viewerImage}
        onClose={() => setViewerImage(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: Colors.text },
  headerSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  postBtn: { backgroundColor: Colors.accent, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 9 },
  postBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  categoriesRow: { flexGrow: 0, marginBottom: 6 },
  categoriesContent: { paddingHorizontal: 14, gap: 8 },
  pill: { backgroundColor: Colors.card, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 6 },
  pillActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  pillText: { color: Colors.textMuted, fontSize: 12, fontWeight: '700' },
  pillTextActive: { color: '#fff' },
  feed: { paddingTop: 6, paddingBottom: 20 },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 60, fontSize: 14 },
});