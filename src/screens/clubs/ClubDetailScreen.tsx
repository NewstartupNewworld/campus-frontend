import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, StatusBar, TextInput, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '../../theme/ThemeProvider';

const BASE_URL = 'https://campus-backend-arfy.onrender.com';

export default function ClubDetailScreen({ route, navigation }: any) {
  const { clubId } = route.params;
  const colors = useColors();
  const [club, setClub] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'members'>('posts');
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => { fetchClub(); }, []);

  const getToken = async () => await AsyncStorage.getItem('token');

  const fetchClub = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/api/clubs/${clubId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setClub(data.club);
      setPosts(data.posts ?? []);
      setMembers(data.members ?? []);
    } catch { } finally { setLoading(false); }
  };

  const toggleJoin = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/api/clubs/${clubId}/join`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setClub((prev: any) => ({
        ...prev,
        is_member: data.joined,
        members_count: data.joined ? prev.members_count + 1 : prev.members_count - 1,
      }));
    } catch { }
  };

  const submitPost = async () => {
    if (!newPost.trim()) return;
    try {
      setPosting(true);
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/api/clubs/${clubId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: newPost.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewPost('');
      fetchClub();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally { setPosting(false); }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color="#7C5CFF" size="large" />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, gap: 12 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}
          style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.text, fontSize: 18 }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 24 }}>{club?.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>{club?.name}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>👥 {club?.members_count} members · {club?.category}</Text>
        </View>
        <TouchableOpacity onPress={toggleJoin}
          style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: club?.is_member ? '#7C5CFF22' : '#7C5CFF' }}>
          <Text style={{ color: club?.is_member ? '#7C5CFF' : '#fff', fontSize: 13, fontWeight: '700' }}>
            {club?.is_member ? '✓ Joined' : '+ Join'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Description */}
      {club?.description && (
        <View style={{ marginHorizontal: 20, marginBottom: 12, backgroundColor: '#7C5CFF15', borderRadius: 12, padding: 12 }}>
          <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 20 }}>{club.description}</Text>
        </View>
      )}

      {/* Tabs */}
      <View style={{ flexDirection: 'row', marginHorizontal: 20, marginBottom: 12, backgroundColor: colors.card, borderRadius: 14, padding: 4 }}>
        {[{ key: 'posts', label: '📝 Posts' }, { key: 'members', label: '👥 Members' }].map(t => (
          <TouchableOpacity key={t.key} onPress={() => setActiveTab(t.key as any)}
            style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: activeTab === t.key ? '#7C5CFF' : 'transparent' }}>
            <Text style={{ color: activeTab === t.key ? '#fff' : colors.textMuted, fontSize: 13, fontWeight: '600' }}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingTop: 0, paddingBottom: 120, gap: 12 }}>

        {/* Posts tab */}
        {activeTab === 'posts' && (
          <>
            {club?.is_member && (
              <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: 12, borderWidth: 0.5, borderColor: colors.border, marginBottom: 4 }}>
                <TextInput value={newPost} onChangeText={setNewPost}
                  placeholder="Post an announcement..." placeholderTextColor={colors.textDim}
                  multiline style={{ color: colors.text, fontSize: 14, minHeight: 60, textAlignVertical: 'top' }}
                />
                <TouchableOpacity onPress={submitPost} disabled={posting || !newPost.trim()}
                  style={{ backgroundColor: newPost.trim() ? '#7C5CFF' : colors.cardAlt, borderRadius: 10, padding: 10, alignItems: 'center', marginTop: 8 }}>
                  {posting ? <ActivityIndicator color="#fff" size="small" /> :
                    <Text style={{ color: newPost.trim() ? '#fff' : colors.textDim, fontWeight: '600' }}>Post</Text>}
                </TouchableOpacity>
              </View>
            )}

            {posts.length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 20 }}>
                <Text style={{ color: colors.textMuted, fontSize: 14 }}>No posts yet. Be the first to post!</Text>
              </View>
            ) : posts.map(post => (
              <View key={post.id} style={{ backgroundColor: colors.card, borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: colors.border }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: '#7C5CFF', fontSize: 13, fontWeight: '600' }}>{post.anonymous_handle}</Text>
                  <Text style={{ color: colors.textDim, fontSize: 11 }}>{timeAgo(post.created_at)}</Text>
                </View>
                <Text style={{ color: colors.textMuted, fontSize: 14, lineHeight: 22 }}>{post.content}</Text>
              </View>
            ))}
          </>
        )}

        {/* Members tab */}
        {activeTab === 'members' && (
          members.map((m, i) => (
            <View key={i} style={{ backgroundColor: colors.card, borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#7C5CFF22', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#7C5CFF', fontSize: 14, fontWeight: '700' }}>
                  {m.anonymous_handle?.slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>{m.anonymous_handle}</Text>
                <Text style={{ color: colors.textDim, fontSize: 12 }}>⭐ {m.trust_score}</Text>
              </View>
              {m.role === 'admin' && (
                <View style={{ backgroundColor: '#7C5CFF22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                  <Text style={{ color: '#7C5CFF', fontSize: 11, fontWeight: '700' }}>Admin</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}