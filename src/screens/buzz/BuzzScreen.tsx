import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, ActivityIndicator,
  RefreshControl, Image, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { Colors } from '../../theme/colors';

// ─── Types ────────────────────────────────────────────────────────────────────

type PostCategory = 'All' | 'Meme' | 'Event' | 'Food' | 'Lost & Found' | 'Rant' | 'News';

interface Reaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

interface Comment {
  id: string;
  author: string;           // anonymous handle e.g. "CampusOwl#42"
  text: string;
  createdAt: string;
}

interface BuzzPost {
  id: string;
  author: string;           // anonymous handle
  category: PostCategory;
  content: string;
  image?: string;
  reactions: Reaction[];
  comments: Comment[];
  createdAt: string;
  college: string;
  trending: boolean;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_POSTS: BuzzPost[] = [
  {
    id: '1',
    author: 'NightOwl#77',
    category: 'Food',
    content: '🍕 FREE PIZZA at the CS dept common room right now!! Someone\'s farewell party leftovers. Run fast!!',
    reactions: [
      { emoji: '🔥', count: 42, reacted: false },
      { emoji: '😂', count: 8, reacted: false },
      { emoji: '❤️', count: 5, reacted: false },
    ],
    comments: [
      { id: 'c1', author: 'HungryBird#12', text: 'Already gone lol 😭', createdAt: new Date(Date.now() - 300000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 600000).toISOString(),
    college: 'IIT Kharagpur',
    trending: true,
  },
  {
    id: '2',
    author: 'GhostCoder#99',
    category: 'Rant',
    content: 'Why does the library WiFi die exactly when submissions are due? Every. Single. Time. 😤',
    reactions: [
      { emoji: '💀', count: 89, reacted: true },
      { emoji: '😤', count: 34, reacted: false },
      { emoji: '😂', count: 21, reacted: false },
    ],
    comments: [
      { id: 'c2', author: 'SleepyDev#03', text: 'Bro it\'s a conspiracy', createdAt: new Date(Date.now() - 1800000).toISOString() },
      { id: 'c3', author: 'WiFiVictim#55', text: 'Filed a complaint 3 times. Nothing.', createdAt: new Date(Date.now() - 900000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    college: 'IIT Kharagpur',
    trending: true,
  },
  {
    id: '3',
    author: 'EventBot#01',
    category: 'Event',
    content: '📣 Hackathon this weekend! 24 hours, ₹50k prize pool. Teams of 2–4. Register by Friday night at the link in bio. Don\'t miss it.',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&q=80',
    reactions: [
      { emoji: '🚀', count: 63, reacted: false },
      { emoji: '❤️', count: 17, reacted: false },
    ],
    comments: [],
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    college: 'IIT Kharagpur',
    trending: false,
  },
  {
    id: '4',
    author: 'LostSoul#22',
    category: 'Lost & Found',
    content: '🔑 Found a set of keys near the hostel C gate. Blue keychain with a small torch. DM me if it\'s yours.',
    reactions: [
      { emoji: '🙏', count: 11, reacted: false },
      { emoji: '❤️', count: 4, reacted: false },
    ],
    comments: [],
    createdAt: new Date(Date.now() - 21600000).toISOString(),
    college: 'IIT Kharagpur',
    trending: false,
  },
];

const CATEGORIES: PostCategory[] = ['All', 'Meme', 'Event', 'Food', 'Lost & Found', 'Rant', 'News'];

const CATEGORY_COLORS: Record<string, string> = {
  Meme: '#FFB347',
  Event: '#4F8CFF',
  Food: '#3DDC84',
  'Lost & Found': '#FF5C5C',
  Rant: '#C97BFF',
  News: '#00C9FF',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// ─── Comment Sheet ────────────────────────────────────────────────────────────

const CommentSheet = ({
  post,
  visible,
  onClose,
  onAddComment,
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
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={cs.sheet}>
          {/* Handle */}
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
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const cs = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: Colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 16, paddingBottom: 30, maxHeight: '75%',
    borderWidth: 1, borderBottomWidth: 0, borderColor: Colors.border,
  },
  handle: {
    width: 36, height: 4, backgroundColor: Colors.border,
    borderRadius: 2, alignSelf: 'center', marginVertical: 12,
  },
  sheetTitle: { fontWeight: '800', fontSize: 16, color: Colors.text, marginBottom: 12 },
  commentList: { flexGrow: 0, maxHeight: 320 },
  emptyComments: { color: Colors.textMuted, textAlign: 'center', paddingVertical: 24, fontSize: 13 },
  commentRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  commentAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  commentBody: { flex: 1 },
  commentAuthor: { fontWeight: '700', fontSize: 12, color: Colors.accent, marginBottom: 2 },
  commentText: { fontSize: 13, color: Colors.text, lineHeight: 18 },
  commentTime: { fontSize: 10, color: Colors.textDim, marginTop: 3 },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12,
  },
  input: {
    flex: 1, backgroundColor: Colors.bg, borderRadius: 16, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 9,
    color: Colors.text, fontSize: 13, maxHeight: 80,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnOff: { backgroundColor: Colors.accentDim },
  sendIcon: { color: '#fff', fontSize: 15 },
});

// ─── Post Card ────────────────────────────────────────────────────────────────

const PostCard = ({
  post,
  onReact,
  onComment,
}: {
  post: BuzzPost;
  onReact: (postId: string, emoji: string) => void;
  onComment: (post: BuzzPost) => void;
}) => {
  const catColor = CATEGORY_COLORS[post.category] ?? Colors.textMuted;

  return (
    <View style={ps.card}>
      {/* Header */}
      <View style={ps.cardHeader}>
        <View style={ps.authorAvatar}>
          <Text style={{ fontSize: 14 }}>👤</Text>
        </View>
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
      </View>

      {/* Content */}
      <Text style={ps.content}>{post.content}</Text>

      {/* Image */}
      {post.image && (
        <Image source={{ uri: post.image }} style={ps.image} resizeMode="cover" />
      )}

      {/* Reactions */}
      <View style={ps.reactionsRow}>
        {post.reactions.map(r => (
          <TouchableOpacity
            key={r.emoji}
            style={[ps.reactionBtn, r.reacted && ps.reactionBtnActive]}
            onPress={() => onReact(post.id, r.emoji)}
            activeOpacity={0.75}
          >
            <Text style={ps.reactionEmoji}>{r.emoji}</Text>
            <Text style={[ps.reactionCount, r.reacted && { color: Colors.accent }]}>
              {r.count}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Comment button */}
        <TouchableOpacity
          style={ps.commentBtn}
          onPress={() => onComment(post)}
          activeOpacity={0.75}
        >
          <Text style={ps.commentBtnText}>💬 {post.comments.length}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ps = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    marginHorizontal: 14, marginBottom: 12, overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    padding: 14, paddingBottom: 10,
  },
  authorAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  authorMeta: { flex: 1 },
  authorName: { fontWeight: '700', fontSize: 13, color: Colors.accent },
  postTime: { fontSize: 10, color: Colors.textDim, marginTop: 1 },
  categoryBadge: {
    borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3,
  },
  categoryText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  trendingBadge: {
    backgroundColor: Colors.warn + '22', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  trendingText: { fontSize: 10, fontWeight: '700', color: Colors.warn },
  content: {
    fontSize: 14, color: Colors.text, lineHeight: 22,
    paddingHorizontal: 14, paddingBottom: 12,
  },
  image: { width: '100%', height: 180 },
  reactionsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: Colors.border,
    flexWrap: 'wrap',
  },
  reactionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.bg, borderRadius: 20, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: 10, paddingVertical: 5,
  },
  reactionBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '18' },
  reactionEmoji: { fontSize: 14 },
  reactionCount: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  commentBtn: {
    marginLeft: 'auto',
    backgroundColor: Colors.bg, borderRadius: 20, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 5,
  },
  commentBtnText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
});

// ─── Create Post Button / Sheet ───────────────────────────────────────────────

const CreatePostSheet = ({
  visible,
  onClose,
  onPost,
}: {
  visible: boolean;
  onClose: () => void;
  onPost: (content: string, category: PostCategory) => void;
}) => {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PostCategory>('Meme');

  const handlePost = () => {
    if (!content.trim()) return;
    onPost(content.trim(), category);
    setContent('');
    setCategory('Meme');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <TouchableOpacity
          style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' } as any}
          onPress={onClose}
        />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={cps.sheet}>
            <View style={cps.handle} />
            <Text style={cps.title}>New Buzz Post</Text>
            <Text style={cps.anon}>Posted anonymously as <Text style={{ color: Colors.accent }}>CampusOwl#42</Text></Text>

            {/* Category picker */}
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

            {/* Text input */}
            <TextInput
              style={cps.input}
              value={content}
              onChangeText={setContent}
              placeholder="What's happening on campus?"
              placeholderTextColor={Colors.textDim}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={cps.charCount}>{content.length}/500</Text>

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
  sheet: {
    backgroundColor: Colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 16, paddingBottom: 32,
    borderWidth: 1, borderBottomWidth: 0, borderColor: Colors.border,
  },
  handle: { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { fontWeight: '800', fontSize: 18, color: Colors.text, marginBottom: 4 },
  anon: { fontSize: 12, color: Colors.textMuted, marginBottom: 14 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  pill: {
    backgroundColor: Colors.bg, borderRadius: 20, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 6,
  },
  pillText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  input: {
    backgroundColor: Colors.bg, borderRadius: 12, borderWidth: 1,
    borderColor: Colors.border, padding: 12, color: Colors.text,
    fontSize: 14, minHeight: 100,
  },
  charCount: { textAlign: 'right', fontSize: 11, color: Colors.textDim, marginTop: 4, marginBottom: 14 },
  postBtn: {
    backgroundColor: Colors.accent, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  postBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

// ─── Main Buzz Screen ─────────────────────────────────────────────────────────

export const BuzzScreen = () => {
  const [posts, setPosts] = useState<BuzzPost[]>(MOCK_POSTS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<PostCategory>('All');
  const [commentPost, setCommentPost] = useState<BuzzPost | null>(null);
  const [createVisible, setCreateVisible] = useState(false);

  const handleReact = (postId: string, emoji: string) => {
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
    // socket.emit('react', { postId, emoji });
  };

  const handleAddComment = (postId: string, text: string) => {
    const newComment: Comment = {
      id: Date.now().toString(),
      author: 'CampusOwl#42',
      text,
      createdAt: new Date().toISOString(),
    };
    setPosts(prev => {
      const updated = prev.map(p =>
        p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p
      );
      // Update commentPost to keep it in sync
      const updatedPost = updated.find(p => p.id === postId);
      if (updatedPost) setCommentPost(updatedPost);
      return updated;
    });
  };

  const handleCreatePost = (content: string, category: PostCategory) => {
    const newPost: BuzzPost = {
      id: Date.now().toString(),
      author: 'CampusOwl#42',
      category,
      content,
      reactions: [
        { emoji: '🔥', count: 0, reacted: false },
        { emoji: '❤️', count: 0, reacted: false },
        { emoji: '😂', count: 0, reacted: false },
      ],
      comments: [],
      createdAt: new Date().toISOString(),
      college: 'IIT Kharagpur',
      trending: false,
    };
    setPosts(prev => [newPost, ...prev]);
    // api.post('/buzz', { content, category });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 800));
    // const data = await api.get('/buzz/feed');
    // setPosts(data);
    setRefreshing(false);
  };

  const filtered = activeCategory === 'All'
    ? posts
    : posts.filter(p => p.category === activeCategory);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>⚡ Buzz</Text>
          <Text style={styles.headerSub}>Anonymous campus feed</Text>
        </View>
        <TouchableOpacity style={styles.postBtn} onPress={() => setCreateVisible(true)}>
          <Text style={styles.postBtnText}>+ Post</Text>
        </TouchableOpacity>
      </View>

      {/* Category filter */}
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

      {/* Feed */}
      <FlatList
        data={filtered}
        keyExtractor={p => p.id}
        contentContainerStyle={styles.feed}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.accent} />
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onReact={handleReact}
            onComment={setCommentPost}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No posts yet. Be the first to buzz! ⚡</Text>
        }
      />

      {/* Comment sheet */}
      <CommentSheet
        post={commentPost}
        visible={!!commentPost}
        onClose={() => setCommentPost(null)}
        onAddComment={handleAddComment}
      />

      {/* Create post sheet */}
      <CreatePostSheet
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onPost={handleCreatePost}
      />
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: Colors.text },
  headerSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  postBtn: {
    backgroundColor: Colors.accent, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 9,
  },
  postBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  categoriesRow: { flexGrow: 0, marginBottom: 6 },
  categoriesContent: { paddingHorizontal: 14, gap: 8 },
  pill: {
    backgroundColor: Colors.card, borderRadius: 20, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 6,
  },
  pillActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  pillText: { color: Colors.textMuted, fontSize: 12, fontWeight: '700' },
  pillTextActive: { color: '#fff' },
  feed: { paddingTop: 6, paddingBottom: 20 },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 60, fontSize: 14 },
});
