import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StatusBar, RefreshControl, Alert, Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../theme/ThemeProvider';

const BASE_URL = 'https://campus-backend-arfy.onrender.com';
const CATEGORIES = ['All', 'Phone', 'Wallet', 'Keys', 'Laptop', 'ID Card', 'Books', 'Clothes', 'Other'];

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TYPE_TABS: { key: 'all' | 'lost' | 'found'; label: string; icon: IconName }[] = [
  { key: 'all', label: 'All', icon: 'search' },
  { key: 'lost', label: 'Lost', icon: 'sad-outline' },
  { key: 'found', label: 'Found', icon: 'checkmark-circle-outline' },
];

type Item = {
  id: number;
  type: 'lost' | 'found';
  title: string;
  description: string;
  location: string;
  category: string;
  contact: string;
  anonymous_handle: string;
  status: string;
  created_at: string;
};

export default function LostFoundScreen({ navigation }: any) {
  const colors = useColors();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeType, setActiveType] = useState<'all' | 'lost' | 'found'>('all');
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchItems(); }, [activeType, category]);

  const getToken = async () => await AsyncStorage.getItem('token');

  const fetchItems = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const params = new URLSearchParams();
      if (activeType !== 'all') params.append('type', activeType);
      if (category !== 'All') params.append('category', category);
      if (search) params.append('search', search);

      const res = await fetch(`${BASE_URL}/api/lost-found?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setItems(data.items ?? []);
    } catch { } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markResolved = async (id: number) => {
    Alert.alert('Mark as Resolved?', 'This will close your post.', [
      { text: 'Cancel' },
      {
        text: 'Yes', onPress: async () => {
          const token = await getToken();
          await fetch(`${BASE_URL}/api/lost-found/${id}/resolve`, {
            method: 'POST', headers: { Authorization: `Bearer ${token}` },
          });
          fetchItems();
        }
      }
    ]);
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
      <View style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ color: colors.text, fontSize: 26, fontWeight: '700' }}>Lost & Found</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CreateLostFound')}
            style={{ backgroundColor: '#F97316', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Post</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ color: colors.textMuted, fontSize: 14 }}>Find lost items on campus</Text>
      </View>

      {/* Type toggle */}
      <View style={{ flexDirection: 'row', marginHorizontal: 20, marginBottom: 12, backgroundColor: colors.card, borderRadius: 14, padding: 4 }}>
        {TYPE_TABS.map(t => {
          const active = activeType === t.key;
          return (
            <TouchableOpacity key={t.key} onPress={() => setActiveType(t.key)}
              style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, backgroundColor: active ? '#F97316' : 'transparent' }}>
              <Ionicons name={t.icon} size={15} color={active ? '#fff' : colors.textMuted} />
              <Text style={{ color: active ? '#fff' : colors.textMuted, fontSize: 13, fontWeight: '600' }}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <TextInput value={search} onChangeText={setSearch}
          placeholder="Search lost/found items..." placeholderTextColor={colors.textDim}
          onSubmitEditing={fetchItems}
          style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14, borderWidth: 0.5, borderColor: colors.border }}
        />
      </View>

      {/* Category chips */}
      <ScrollView horizontal style={{ flexGrow: 0, flexShrink: 0 }} showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 12 }}>
        {CATEGORIES.map(c => (
          <TouchableOpacity key={c} onPress={() => setCategory(c)}
            style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: category === c ? '#F97316' : colors.card, borderWidth: 0.5, borderColor: category === c ? '#F97316' : colors.border }}>
            <Text style={{ color: category === c ? '#fff' : colors.textMuted, fontSize: 13, fontWeight: '500' }}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Items list */}
      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingTop: 0, paddingBottom: 100, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchItems(); }} tintColor="#F97316" />}>

        {loading ? <ActivityIndicator color="#F97316" size="large" style={{ marginTop: 40 }} />
          : items.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Ionicons name="search-outline" size={48} color={colors.textDim} style={{ marginBottom: 12 }} />
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Nothing here yet</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
                Lost something? Post it here and your campus mates will help!
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('CreateLostFound')}
                style={{ backgroundColor: '#F97316', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '600' }}>Post Item</Text>
              </TouchableOpacity>
            </View>
          ) : items.map(item => {
            const isLost = item.type === 'lost';
            return (
              <View key={item.id} style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: colors.border }}>
                {/* Top row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{
                      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4,
                      backgroundColor: isLost ? '#EF444422' : '#22C55E22',
                    }}>
                      <Ionicons name={isLost ? 'sad-outline' : 'checkmark-circle'} size={13} color={isLost ? '#EF4444' : '#22C55E'} />
                      <Text style={{ color: isLost ? '#EF4444' : '#22C55E', fontSize: 12, fontWeight: '700' }}>
                        {isLost ? 'LOST' : 'FOUND'}
                      </Text>
                    </View>
                    {item.category ? (
                      <View style={{ backgroundColor: '#F9731622', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                        <Text style={{ color: '#F97316', fontSize: 11 }}>{item.category}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={{ color: colors.textDim, fontSize: 11 }}>{timeAgo(item.created_at)}</Text>
                </View>

                {/* Title */}
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 6 }}>{item.title}</Text>

                {/* Description */}
                {item.description ? (
                  <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 20, marginBottom: 8 }} numberOfLines={3}>
                    {item.description}
                  </Text>
                ) : null}

                {/* Location */}
                {item.location ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                    <Ionicons name="location-outline" size={13} color={colors.textDim} />
                    <Text style={{ color: colors.textDim, fontSize: 12 }}>{item.location}</Text>
                  </View>
                ) : null}

                {/* Footer */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <Text style={{ color: colors.textDim, fontSize: 11 }}>by {item.anonymous_handle}</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {item.contact ? (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(`tel:${item.contact}`)}
                        style={{ backgroundColor: '#22C55E22', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="call-outline" size={13} color="#22C55E" />
                        <Text style={{ color: '#22C55E', fontSize: 12, fontWeight: '600' }}>Contact</Text>
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                      onPress={() => markResolved(item.id)}
                      style={{ backgroundColor: '#4F7CFF22', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="checkmark" size={13} color="#4F7CFF" />
                      <Text style={{ color: '#4F7CFF', fontSize: 12, fontWeight: '600' }}>Resolved</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
      </ScrollView>
    </View>
  );
}