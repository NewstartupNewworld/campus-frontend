import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, RefreshControl, Image,
  KeyboardAvoidingView, Platform, Modal, Alert, ActivityIndicator, Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '../../theme/ThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = 'https://campus-backend-production-2dbb.up.railway.app';

type PostCategory = 'All' | 'Meme' | 'Event' | 'Food' | 'Lost & Found' | 'Rant' | 'News';

interface Comment { id: string; author: string; text: string; createdAt: string; }
interface BuzzPost {
  id: string; author: string; category: PostCategory; content: string; image?: string;
  reactions: { emoji: string; count: number; reacted: boolean }[];
  comments: Comment[]; comment_count?: number; createdAt: string; trending: boolean; saved?: boolean; isOwner?: boolean;
}

const CATEGORIES: PostCategory[] = ['All', 'Meme', 'Event', 'Food', 'Lost & Found', 'Rant', 'News'];
const CATEGORY_COLORS: Record<string, string> = {
  Meme: '#FFB347', Event: '#4F8CFF', Food: '#3DDC84', 'Lost & Found': '#FF5C5C', Rant: '#C97BFF', News: '#00C9FF',
};
const DEFAULT_REACTIONS = [
  { emoji: '🔥', count: 0, reacted: false },
  { emoji: '❤️', count: 0, reacted: false },
  { emoji: '😂', count: 0, reacted: false },
];
const STORY_COLORS = ['#FF6B6B', '#4F8CFF', '#FFB347', '#3DDC84', '#C97BFF', '#00C9FF'];

const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.18,
  shadowRadius: 10,
  elevation: 4,
};
const softShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,
  shadowRadius: 5,
  elevation: 2,
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
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

const StoriesRow = ({ posts }: { posts: BuzzPost[] }) => {
  const Colors = useColors();
  const sr = StyleSheet.create({
    container: { backgroundColor: Colors.bg, paddingBottom: 4 },
    row: { paddingHorizontal: 14, paddingVertical: 8, gap: 14 },
    storyWrap: { alignItems: 'center', gap: 4 },
    ring: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, padding: 2 },
    avatar: { flex: 1, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    initials: { fontSize: 14, fontWeight: '800' },
    name: { fontSize: 10, color: Colors.textMuted, width: 52, textAlign: 'center' },
  });
  const uniqueAuthors = Array.from(new Set(posts.map(p => p.author))).slice(0, 8);
  if (uniqueAuthors.length === 0) return null;
  return (
    <View style={sr.container}>
      <FlatList
        data={uniqueAuthors}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={a => a}
        contentContainerStyle={sr.row}
        renderItem={({ item, index }) => {
          const color = STORY_COLORS[index % STORY_COLORS.length];
          return (
            <TouchableOpacity style={sr.storyWrap} activeOpacity={0.8}>
              <View style={[sr.ring, { borderColor: color }]}>
                <View style={[sr.avatar, { backgroundColor: color + '33' }]}>
                  <Text style={[sr.initials, { color }]}>{item.slice(0, 2).toUpperCase()}</Text>
                </View>
              </View>
              <Text style={sr.name} numberOfLines={1}>{item.split('#')[0]}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const CommentSheet = ({ post, visible, onClose, onAddComment }: { post: BuzzPost | null; visible: boolean; onClose: () => void; onAddComment: (postId: string, text: string) => void }) => {
  const Colors = useColors();
  const [text, setText] = useState('');
  const cs = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
    kavContainer: { width: '100%' },
    sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 16, paddingBottom: 30, maxHeight: '85%', ...cardShadow },
    handle: { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginVertical: 12 },
    sheetTitle: { fontWeight: '800', fontSize: 16, color: Colors.text, marginBottom: 12 },
    commentList: { flexGrow: 0, maxHeight: 320 },
    emptyComments: { color: Colors.textMuted, textAlign: 'center', paddingVertical: 24, fontSize: 13 },
    commentRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    commentAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
    commentBody: { flex: 1 },
    commentAuthor: { fontWeight: '700', fontSize: 12, color: Colors.accent, marginBottom: 2 },
    commentText: { fontSize: 13, color: Colors.text, lineHeight: 18 },
    commentTime: { fontSize: 10, color: Colors.textDim, marginTop: 3 },
    inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 12, paddingTop: 12 },
    input: { flex: 1, backgroundColor: Colors.bg, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9, color: Colors.text, fontSize: 13, maxHeight: 80 },
    sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
    sendBtnOff: { backgroundColor: Colors.accentDim },
    sendIcon: { color: '#fff', fontSize: 15 },
  });
  if (!post) return null;
  const handleSend = () => { if (!text.trim()) return; onAddComment(post.id, text.trim()); setText(''); };
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={cs.overlay}>
        <TouchableOpacity style={cs.backdrop} onPress={onClose} />
        <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25} style={cs.kavContainer}>
          <View style={cs.sheet}>
            <View style={cs.handle} />
            <Text style={cs.sheetTitle}>Comments ({post.comments.length})</Text>
            <FlatList
              data={post.comments}
              keyExtractor={c => c.id}
              style={cs.commentList}
              ListEmptyComponent={<Text style={cs.emptyComments}>No comments yet. Be first! 👇</Text>}
              renderItem={({ item }) => (
                <View style={cs.commentRow}>
                  <View style={cs.commentAvatar}><Text style={{ fontSize: 13 }}>👤</Text></View>
                  <View style={cs.commentBody}>
                    <Text style={cs.commentAuthor}>{item.author}</Text>
                    <Text style={cs.commentText}>{item.text}</Text>
                    <Text style={cs.commentTime}>{timeAgo(item.createdAt)}</Text>
                  </View>
                </View>
              )}
            />
            <View style={cs.inputRow}>
              <TextInput style={cs.input} value={text} onChangeText={setText} placeholder="Add a comment..." placeholderTextColor={Colors.textDim} multiline maxLength={300} />
              <TouchableOpacity style={[cs.sendBtn, !text.trim() && cs.sendBtnOff]} onPress={handleSend} disabled={!text.trim()}>
                <Text style={cs.sendIcon}>➤</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const PostCard = ({ post, onReact, onComment, onDelete, onImagePress, onSave }: { post: BuzzPost; onReact: (postId: string, emoji: string) => void; onComment: (post: BuzzPost) => void; onDelete: (postId: string) => void; onImagePress: (uri: string) => void; onSave: (postId: string) => void }) => {
  const Colors = useColors();
  const ps = StyleSheet.create({
    card: { backgroundColor: Colors.card, borderRadius: 18, marginHorizontal: 14, marginBottom: 10, overflow: 'hidden', ...softShadow },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 },
    authorAvatar: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    authorAvatarText: { fontSize: 11, fontWeight: '700', color: '#fff' },
    authorMeta: { flex: 1 },
    authorName: { fontWeight: '700', fontSize: 12.5, color: Colors.accent },
    postTime: { fontSize: 10, color: Colors.textDim, marginTop: 0 },
    categoryDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
    categoryText: { fontSize: 10, fontWeight: '700' },
    categoryWrap: { flexDirection: 'row', alignItems: 'center' },
    trendingText: { fontSize: 11, marginLeft: 6 },
    content: { fontSize: 13.5, color: Colors.text, lineHeight: 19, paddingHorizontal: 12, paddingBottom: 10 },
    image: { width: '100%', height: 180 },
    reactionsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9 },
    reactionBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg, borderRadius: 18, overflow: 'hidden' },
    reactionSeg: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 9, paddingVertical: 6 },
    reactionSegActive: { backgroundColor: Colors.accent + '20' },
    reactionEmoji: { fontSize: 13 },
    reactionCount: { fontSize: 11, fontWeight: '700', color: Colors.textMuted },
    commentBtn: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4 },
    commentBtnText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
    saveBtn: { paddingHorizontal: 6, paddingVertical: 4 },
    saveIcon: { fontSize: 14 },
    menuBtn: { padding: 4, marginLeft: 2 },
    menuDots: { fontSize: 18, color: Colors.textMuted, fontWeight: '900' },
    menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    menuCard: { backgroundColor: Colors.card, borderRadius: 14, width: '70%', overflow: 'hidden', ...cardShadow },
    menuItem: { paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center' },
    menuItemTextDanger: { color: Colors.danger, fontWeight: '700', fontSize: 15 },
    heartOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
    heartEmoji: { fontSize: 76 },
  });

  const catColor = CATEGORY_COLORS[post.category] ?? Colors.textMuted;
  const [showMenu, setShowMenu] = useState(false);
  const lastTap = React.useRef<number>(0);
  const heartScale = React.useRef(new Animated.Value(0)).current;
  const isOwner = !!post.isOwner;

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      const fireReaction = post.reactions.find(r => r.emoji === '🔥');
      if (fireReaction && !fireReaction.reacted) onReact(post.id, '🔥');
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
        <LinearGradient colors={[Colors.accent, Colors.accentAlt]} style={ps.authorAvatar}>
          <Text style={ps.authorAvatarText}>{post.author.slice(0, 2).toUpperCase()}</Text>
        </LinearGradient>
        <View style={ps.authorMeta}>
          <Text style={ps.authorName}>{post.author}</Text>
          <View style={ps.categoryWrap}>
            <View style={[ps.categoryDot, { backgroundColor: catColor }]} />
            <Text style={[ps.categoryText, { color: catColor }]}>{post.category}</Text>
            <Text style={ps.postTime}> · {timeAgo(post.createdAt)}</Text>
            {post.trending && <Text style={ps.trendingText}>🔥</Text>}
          </View>
        </View>
        {isOwner && <TouchableOpacity style={ps.menuBtn} onPress={() => setShowMenu(true)}><Text style={ps.menuDots}>⋮</Text></TouchableOpacity>}
      </View>
      <TouchableOpacity activeOpacity={1} onPress={handleDoubleTap}>
        <Text style={ps.content}>{post.content}</Text>
        {post.image && (
          <View>
            <TouchableOpacity activeOpacity={0.9} onPress={() => onImagePress(post.image!)} onLongPress={handleDoubleTap}>
              <Image source={{ uri: post.image }} style={ps.image} resizeMode="cover" />
            </TouchableOpacity>
            <Animated.View pointerEvents="none" style={[ps.heartOverlay, { opacity: heartScale, transform: [{ scale: heartScale.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.4] }) }] }]}>
              <Text style={ps.heartEmoji}>🔥</Text>
            </Animated.View>
          </View>
        )}
      </TouchableOpacity>
      <View style={ps.reactionsRow}>
        <View style={ps.reactionBar}>
          {post.reactions.map((r, idx) => (
            <TouchableOpacity
              key={r.emoji}
              style={[ps.reactionSeg, r.reacted && ps.reactionSegActive, idx > 0 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: Colors.border }]}
              onPress={() => onReact(post.id, r.emoji)}
              activeOpacity={0.7}
            >
              <Text style={ps.reactionEmoji}>{r.emoji}</Text>
              {r.count > 0 && <Text style={[ps.reactionCount, r.reacted && { color: Colors.accent }]}>{r.count}</Text>}
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={ps.commentBtn} onPress={() => onComment(post)} activeOpacity={0.7}>
          <Text style={ps.commentBtnText}>💬 {post.comments.length || post.comment_count || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={ps.saveBtn} onPress={() => onSave(post.id)} activeOpacity={0.7}>
          <Text style={ps.saveIcon}>{post.saved ? '🔖' : '📑'}</Text>
        </TouchableOpacity>
      </View>
      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <TouchableOpacity style={ps.menuOverlay} activeOpacity={1} onPress={() => setShowMenu(false)}>
          <View style={ps.menuCard}>
            <TouchableOpacity style={ps.menuItem} onPress={() => {
              setShowMenu(false);
              Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => onDelete(post.id) },
              ]);
            }}>
              <Text style={ps.menuItemTextDanger}>🗑️ Delete Post</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const CreatePostSheet = ({ visible, onClose, onPost }: { visible: boolean; onClose: () => void; onPost: (content: string, category: PostCategory, image?: string) => void }) => {
  const Colors = useColors();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PostCategory>('Meme');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const cps = StyleSheet.create({
    sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16, paddingBottom: 32, ...cardShadow },
    handle: { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
    title: { fontWeight: '800', fontSize: 18, color: Colors.text, marginBottom: 4 },
    anon: { fontSize: 12, color: Colors.textMuted, marginBottom: 14 },
    pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
    pill: { backgroundColor: Colors.bg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
    pillText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
    input: { backgroundColor: Colors.bg, borderRadius: 14, padding: 12, color: Colors.text, fontSize: 14, minHeight: 80 },
    charCount: { textAlign: 'right', fontSize: 11, color: Colors.textDim, marginTop: 4, marginBottom: 10 },
    imagePreviewWrap: { position: 'relative', marginBottom: 10 },
    imagePreview: { width: '100%', height: 160, borderRadius: 14 },
    removeImage: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
    mediaRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    mediaBtn: { flex: 1, backgroundColor: Colors.bg, borderRadius: 14, paddingVertical: 10, alignItems: 'center' },
    mediaBtnText: { fontSize: 13, fontWeight: '700', color: Colors.text },
    postBtn: { backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
    postBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  });

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow access to your photo library.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.8 });
    if (!result.canceled && result.assets[0]) setSelectedImage(result.assets[0].uri);
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow camera access.'); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.8 });
    if (!result.canceled && result.assets[0]) setSelectedImage(result.assets[0].uri);
  };

  const handlePost = () => {
    if (!content.trim()) return;
    onPost(content.trim(), category, selectedImage || undefined);
    setContent(''); setCategory('Meme'); setSelectedImage(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <TouchableOpacity style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' }} onPress={onClose} />
        <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}>
          <View style={cps.sheet}>
            <View style={cps.handle} />
            <Text style={cps.title}>New Buzz Post</Text>
            <Text style={cps.anon}>Posted anonymously</Text>
            <View style={cps.pills}>
              {(CATEGORIES.filter(c => c !== 'All') as PostCategory[]).map(cat => (
                <TouchableOpacity key={cat} style={[cps.pill, category === cat && { backgroundColor: (CATEGORY_COLORS[cat] ?? Colors.accent) + '22' }]} onPress={() => setCategory(cat)}>
                  <Text style={[cps.pillText, category === cat && { color: CATEGORY_COLORS[cat] ?? Colors.accent }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={cps.input} value={content} onChangeText={setContent} placeholder="What's happening on campus?" placeholderTextColor={Colors.textDim} multiline numberOfLines={4} textAlignVertical="top" maxLength={500} />
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
              <TouchableOpacity style={cps.mediaBtn} onPress={handleCamera}><Text style={cps.mediaBtnText}>📷 Camera</Text></TouchableOpacity>
              <TouchableOpacity style={cps.mediaBtn} onPress={handlePickImage}><Text style={cps.mediaBtnText}>🖼️ Gallery</Text></TouchableOpacity>
            </View>
            <TouchableOpacity style={[cps.postBtn, !content.trim() && { opacity: 0.5 }]} onPress={handlePost} disabled={!content.trim()}>
              <Text style={cps.postBtnText}>⚡ Post to Buzz</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export const BuzzScreen = () => {
  const Colors = useColors();
  const [posts, setPosts] = useState<BuzzPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<PostCategory>('All');
  const [commentPost, setCommentPost] = useState<BuzzPost | null>(null);
  const [createVisible, setCreateVisible] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
    headerTitle: { fontSize: 20, fontWeight: '900', color: Colors.text },
    headerSub: { fontSize: 11.5, color: Colors.textMuted, marginTop: 1 },
    postBtn: { backgroundColor: Colors.accent, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 8, ...softShadow },
    postBtnText: { color: '#fff', fontWeight: '800', fontSize: 12.5 },
    categoriesRow: { flexGrow: 0, marginBottom: 4 },
    categoriesContent: { paddingHorizontal: 14, gap: 7 },
    pill: { backgroundColor: Colors.card, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 6 },
    pillActive: { backgroundColor: Colors.accent },
    pillText: { color: Colors.textMuted, fontSize: 12, fontWeight: '700' },
    pillTextActive: { color: '#fff' },
    feed: { paddingTop: 4, paddingBottom: 20 },
    empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 60, fontSize: 14 },
  });

  const fetchPosts = useCallback(async (category: PostCategory, pageNum: number = 1, append: boolean = false) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const url = category === 'All' ? `${API_URL}/api/buzz/feed?page=${pageNum}` : `${API_URL}/api/buzz/feed?category=${encodeURIComponent(category)}&page=${pageNum}`;
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (response.ok && data.posts) {
        const mapped: BuzzPost[] = data.posts.map((p: any) => ({
          id: p.id, author: p.author, category: p.category, content: p.content,
          image: p.image_url || undefined,
          reactions: DEFAULT_REACTIONS.map(r => ({ ...r })),
          comments: [], comment_count: parseInt(p.comment_count) || 0,
          createdAt: p.created_at, trending: parseInt(p.comment_count) > 5, isOwner: !!p.isOwner,
        }));
        if (append) { setPosts(prev => [...prev, ...mapped]); } else { setPosts(mapped); }
        setHasMore(mapped.length === 20);
      }
    } catch (e) { console.error('Fetch buzz error:', e); }
    finally { setLoading(false); setRefreshing(false); setLoadingMore(false); }
  }, []);

  useEffect(() => { setLoading(true); setPage(1); setHasMore(true); fetchPosts(activeCategory, 1, false); }, [activeCategory, fetchPosts]);

  const handleReact = async (postId: string, emoji: string) => {
    setPosts(prev => prev.map(p => p.id !== postId ? p : { ...p, reactions: p.reactions.map(r => r.emoji === emoji ? { ...r, count: r.reacted ? r.count - 1 : r.count + 1, reacted: !r.reacted } : r) }));
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(`${API_URL}/api/buzz/${postId}/react`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ emoji }) });
    } catch (e) { console.error('React error:', e); }
  };

  const fetchComments = async (postId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/buzz/${postId}/comments`, { headers: { Authorization: `Bearer ${token}` }, method: 'GET' });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        const comments: Comment[] = data.map((c: any) => ({ id: c.id, author: c.author, text: c.text, createdAt: c.created_at }));
        setPosts(prev => {
          const updated = prev.map(p => p.id === postId ? { ...p, comments, comment_count: comments.length } : p);
          const updatedPost = updated.find(p => p.id === postId);
          if (updatedPost) setCommentPost(updatedPost);
          return updated;
        });
      }
    } catch (e) {}
  };

  const handleOpenComments = (post: BuzzPost) => { setCommentPost(post); fetchComments(post.id); };

  const handleAddComment = async (postId: string, text: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/buzz/${postId}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ text }) });
      const data = await response.json();
      if (response.ok) {
        const newComment: Comment = { id: data.id, author: data.author, text: data.text, createdAt: data.created_at };
        setPosts(prev => {
          const updated = prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment], comment_count: (p.comment_count || 0) + 1 } : p);
          const updatedPost = updated.find(p => p.id === postId);
          if (updatedPost) setCommentPost(updatedPost);
          return updated;
        });
      } else { Alert.alert('Error', data.error || 'Failed to add comment'); }
    } catch (e) { Alert.alert('Error', 'Failed to add comment. Check your connection.'); }
  };

  const handleCreatePost = async (content: string, category: PostCategory, image?: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/buzz`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ content, category, imageUrl: image || null }) });
      const data = await response.json();
      if (response.ok) { fetchPosts(activeCategory, 1, false); } else { Alert.alert('Error', data.error || 'Failed to post'); }
    } catch (e) { Alert.alert('Error', 'Failed to post. Check your connection.'); }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/buzz/${postId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) { setPosts(prev => prev.filter(p => p.id !== postId)); }
      else { const data = await response.json(); Alert.alert('Error', data.error || 'Failed to delete post'); }
    } catch (e) { Alert.alert('Error', 'Failed to delete post. Check your connection.'); }
  };

  const handleSavePost = async (postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, saved: !p.saved } : p));
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(`${API_URL}/api/buzz/${postId}/save`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    } catch (e) { console.error('Save error:', e); }
  };

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(activeCategory, nextPage, true);
  };

  const handleRefresh = async () => { setRefreshing(true); setPage(1); setHasMore(true); fetchPosts(activeCategory, 1, false); };

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
      <FlatList data={CATEGORIES} horizontal showsHorizontalScrollIndicator={false} keyExtractor={i => i} contentContainerStyle={styles.categoriesContent} style={styles.categoriesRow}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.pill, activeCategory === item && styles.pillActive]} onPress={() => setActiveCategory(item as PostCategory)}>
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
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={<StoriesRow posts={posts} />}
          renderItem={({ item }) => <PostCard post={item} onReact={handleReact} onComment={handleOpenComments} onDelete={handleDeletePost} onImagePress={setViewerImage} onSave={handleSavePost} />}
          ListEmptyComponent={<Text style={styles.empty}>No posts yet. Be the first to buzz! ⚡</Text>}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={Colors.accent} style={{ marginVertical: 20 }} /> : null}
        />
      )}
      <CommentSheet post={commentPost} visible={!!commentPost} onClose={() => setCommentPost(null)} onAddComment={handleAddComment} />
      <CreatePostSheet visible={createVisible} onClose={() => setCreateVisible(false)} onPost={handleCreatePost} />
      <ImageViewerModal visible={!!viewerImage} uri={viewerImage} onClose={() => setViewerImage(null)} />
    </SafeAreaView>
  );
};