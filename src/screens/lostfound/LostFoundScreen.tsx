import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StatusBar, RefreshControl, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../../theme/ThemeProvider';
import MediaView from '../../components/MediaView';
import { isVideoUrl } from '../../utils/media';

const BASE_URL = 'https://campus-backend-arfy.onrender.com';
const CATEGORIES = ['All', 'Phone', 'Wallet', 'Keys', 'Laptop', 'ID Card', 'Books', 'Clothes', 'Other'];

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TYPE_TABS: { key: 'all' | 'lost' | 'found'; label: string; icon: IconName }[] = [
  { key: 'all', label: 'All', icon: 'search' },
  { key: 'lost', label: 'Lost', icon: 'sad-outline' },
  { key: 'found', label: 'Found', icon: 'checkmark-circle-outline' },
];

type Item = {
  id: number | string;
  user_id?: string;
  type: 'lost' | 'found';
  title: string;
  description: string;
  location: string;
  category: string;
  contact: string;
  image_url?: string | null;
  anonymous_handle: string;
  status: string;
  created_at: string;
};

// A photo opens full screen when tapped. A video waits for a tap so a long list does not start many players at once.
function ItemMedia({ uri }: { uri: string }) {
  const [playing, setPlaying] = useState(false);
  if (!isVideoUrl(uri)) return <MediaView uri={uri} height={200} />;
  if (playing) return <MediaView uri={uri} height={220} />;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => setPlaying(true)}
      accessibilityRole="button"
      accessibilityLabel="Play video"
      style={{ height: 160, borderRadius: 14, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}
    >
      <Ionicons name="play-circle" size={54} color="#fff" />
      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 }}>Tap to play video</Text>
    </TouchableOpacity>
  );
}

export default function LostFoundScreen({ navigation }: any) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [activeType, setActiveType] = useState<'all' | 'lost' | 'found'>('all');
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [me, setMe] = useState({ id: '', handle: '' });
  const searchRef = useRef('');

  useEffect(() => {
    AsyncStorage.getItem('user').then((raw) => {
      try {
        const u = raw ? JSON.parse(raw) : {};
        setMe({ id: String(u.id ?? ''), handle: String(u.anonymous_handle ?? '') });
      } catch {
        // Keep empty values
      }
    });
  }, []);

  const getToken = async () => await AsyncStorage.getItem('token');

  const fetchItems = useCallback(async () => {
    try {
      const token = await getToken();
      const params = new URLSearchParams();
      if (activeType !== 'all') params.append('type', activeType);
      if (category !== 'All') params.append('category', category);
      if (searchRef.current.trim()) params.append('search', searchRef.current.trim());

      const res = await fetch(`${BASE_URL}/api/lost-found?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Could not load');
      setItems(data.items ?? []);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeType, category]);

  // A new filter shows the spinner. Opening this screen again (for example after posting) refreshes it.
  useEffect(() => { setLoading(true); }, [activeType, category]);
  useFocusEffect(useCallback(() => { fetchItems(); }, [fetchItems]));

  const markResolved = (id: number | string) => {
    Alert.alert('Mark as Resolved?', 'This will close your post.', [
      { text: 'Cancel' },
      {
        text: 'Yes',
        onPress: async () => {
          try {
            const token = await getToken();
            const res = await fetch(`${BASE_URL}/api/lost-found/${id}/resolve`, {
              method: 'POST', headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('failed');
            fetchItems();
          } catch {
            Alert.alert('Could not update', 'Please check your internet and try again.');
          }
        },
      },
    ]);
  };

  const messagePoster = async (item: Item) => {
    if (!item.user_id) return;
    try {
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/api/dm/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: item.user_id, topic: 'Lost & Found' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not open the chat');
      navigation.navigate('DirectChat', { chatId: data.chatId, handle: data.other?.handle ?? item.anonymous_handle });
    } catch (e: any) {
      Alert.alert('Could not message', e?.message ?? 'Please try again.');
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: insets.top + 12, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ color: colors.text, fontSize: 26, fontWeight: '700' }}>Lost & Found</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateLostFound')}
            accessibilityRole="button"
            accessibilityLabel="Post an item"
            style={{ backgroundColor: '#F97316', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Post</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ color: colors.textMuted, fontSize: 14 }}>Find lost items on campus</Text>
      </View>

      {/* Type toggle */}
      <View style={{ flexDirection: 'row', marginHorizontal: 20, marginBottom: 12, backgroundColor: colors.card, borderRadius: 14, padding: 4 }}>
        {TYPE_TABS.map((t) => {
          const active = activeType === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setActiveType(t.key)}
              style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, backgroundColor: active ? '#F97316' : 'transparent' }}
            >
              <Ionicons name={t.icon} size={15} color={active ? '#fff' : colors.textMuted} />
              <Text style={{ color: active ? '#fff' : colors.textMuted, fontSize: 13, fontWeight: '600' }}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <TextInput
          value={search}
          onChangeText={(v) => { setSearch(v); searchRef.current = v; }}
          placeholder="Search lost/found items..."
          placeholderTextColor={colors.textDim}
          returnKeyType="search"
          onSubmitEditing={() => { setLoading(true); fetchItems(); }}
          style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14, borderWidth: 0.5, borderColor: colors.border }}
        />
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, flexShrink: 0 }}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 12 }}
      >
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => setCategory(c)}
            style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: category === c ? '#F97316' : colors.card, borderWidth: 0.5, borderColor: category === c ? '#F97316' : colors.border }}
          >
            <Text style={{ color: category === c ? '#fff' : colors.textMuted, fontSize: 13, fontWeight: '500' }}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Items list */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingTop: 0, paddingBottom: 100, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchItems(); }} tintColor="#F97316" />}
      >
        {loading ? (
          <ActivityIndicator color="#F97316" size="large" style={{ marginTop: 40 }} />
        ) : failed && items.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 40, gap: 8 }}>
            <Ionicons name="cloud-offline-outline" size={40} color={colors.textDim} />
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>Could not load the items</Text>
            <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center' }}>Check your internet and try again.</Text>
            <TouchableOpacity
              onPress={() => { setLoading(true); fetchItems(); }}
              style={{ marginTop: 8, backgroundColor: '#F97316', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : items.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <Ionicons name="search-outline" size={48} color={colors.textDim} style={{ marginBottom: 12 }} />
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Nothing here yet</Text>
            <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
              Lost something? Post it here and your campus mates will help!
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('CreateLostFound')}
              style={{ backgroundColor: '#F97316', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '600' }}>Post Item</Text>
            </TouchableOpacity>
          </View>
        ) : (
          items.map((item) => {
            const isLost = item.type === 'lost';
            const badge = isLost ? '#EF4444' : '#22C55E';
            const mine = item.user_id ? String(item.user_id) === me.id : !!me.handle && item.anonymous_handle === me.handle;
            const resolved = item.status === 'resolved';
            return (
              <View key={String(item.id)} style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: colors.border }}>
                {/* Top row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: badge + '22' }}>
                      <Ionicons name={isLost ? 'sad-outline' : 'checkmark-circle'} size={13} color={badge} />
                      <Text style={{ color: badge, fontSize: 11, fontWeight: '700' }}>{isLost ? 'LOST' : 'FOUND'}</Text>
                    </View>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#F9731622' }}>
                      <Text style={{ color: '#F97316', fontSize: 11, fontWeight: '600' }}>{item.category}</Text>
                    </View>
                  </View>
                  <Text style={{ color: colors.textDim, fontSize: 11 }}>{timeAgo(item.created_at)}</Text>
                </View>

                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 4 }}>{item.title}</Text>
                {item.description ? (
                  <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 10 }}>{item.description}</Text>
                ) : null}

                {item.image_url ? (
                  <View style={{ marginBottom: 10 }}>
                    <ItemMedia uri={item.image_url} />
                  </View>
                ) : null}

                {item.location ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12 }}>
                    <Ionicons name="location-outline" size={14} color={colors.textDim} />
                    <Text style={{ color: colors.textDim, fontSize: 12.5, flexShrink: 1 }}>{item.location}</Text>
                  </View>
                ) : null}

                {/* Footer */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <Text style={{ color: colors.textDim, fontSize: 12, flexShrink: 1 }} numberOfLines={1}>by {item.anonymous_handle}</Text>
                  {mine ? (
                    resolved ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#22C55E22' }}>
                        <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
                        <Text style={{ color: '#22C55E', fontWeight: '700', fontSize: 12.5 }}>Resolved</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => markResolved(item.id)}
                        accessibilityRole="button"
                        accessibilityLabel="Mark as resolved"
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#2F54EB22' }}
                      >
                        <Ionicons name="checkmark" size={14} color="#4F7CFF" />
                        <Text style={{ color: '#4F7CFF', fontWeight: '700', fontSize: 12.5 }}>Resolved</Text>
                      </TouchableOpacity>
                    )
                  ) : item.user_id ? (
                    <TouchableOpacity
                      onPress={() => messagePoster(item)}
                      accessibilityRole="button"
                      accessibilityLabel={`Message ${item.anonymous_handle}`}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#22C55E22' }}
                    >
                      <Ionicons name="chatbubble-ellipses" size={14} color="#22C55E" />
                      <Text style={{ color: '#22C55E', fontWeight: '700', fontSize: 12.5 }}>Message</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
// END OF FILE