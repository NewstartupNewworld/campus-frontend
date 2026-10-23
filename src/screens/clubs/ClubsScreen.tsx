import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StatusBar, RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../theme/ThemeProvider';

const BASE_URL = 'https://campus-backend-arfy.onrender.com';
const CATEGORIES = ['All', 'Tech', 'Cultural', 'Sports', 'Music', 'Dance', 'Literary', 'Social', 'Science', 'Other'];

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: { key: 'all' | 'my'; label: string; icon: IconName }[] = [
  { key: 'all', label: 'All Clubs', icon: 'globe-outline' },
  { key: 'my', label: 'My Clubs', icon: 'star-outline' },
];

type Club = {
  id: number;
  name: string;
  description: string;
  category: string;
  icon: string;
  members_count: number;
  is_member: boolean;
};

export default function ClubsScreen({ navigation }: any) {
  const colors = useColors();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');

  useEffect(() => { fetchClubs(); }, [category, activeTab]);

  const getToken = async () => await AsyncStorage.getItem('token');

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const url = activeTab === 'my'
        ? `${BASE_URL}/api/clubs/my/joined`
        : `${BASE_URL}/api/clubs?category=${category}&search=${search}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setClubs(data.clubs ?? []);
    } catch { } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleJoin = async (id: number, isMember: boolean) => {
    try {
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/api/clubs/${id}/join`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setClubs(prev => prev.map(c => c.id === id ? {
        ...c,
        is_member: data.joined,
        members_count: data.joined ? c.members_count + 1 : c.members_count - 1,
      } : c));
    } catch { }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ color: colors.text, fontSize: 26, fontWeight: '700' }}>Clubs</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CreateClub')}
            style={{ backgroundColor: '#7C5CFF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Create</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ color: colors.textMuted, fontSize: 14 }}>Campus clubs & societies</Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', marginHorizontal: 20, marginBottom: 12, backgroundColor: colors.card, borderRadius: 14, padding: 4 }}>
        {TABS.map(t => {
          const active = activeTab === t.key;
          return (
            <TouchableOpacity key={t.key} onPress={() => setActiveTab(t.key)}
              style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, backgroundColor: active ? '#7C5CFF' : 'transparent' }}>
              <Ionicons name={t.icon} size={15} color={active ? '#fff' : colors.textMuted} />
              <Text style={{ color: active ? '#fff' : colors.textMuted, fontSize: 13, fontWeight: '600' }}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Search */}
      {activeTab === 'all' && (
        <>
          <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
            <TextInput value={search} onChangeText={setSearch}
              placeholder="Search clubs..." placeholderTextColor={colors.textDim}
              onSubmitEditing={fetchClubs}
              style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14, borderWidth: 0.5, borderColor: colors.border }}
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 12 }}>
            {CATEGORIES.map(c => (
              <TouchableOpacity key={c} onPress={() => setCategory(c)}
                style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: category === c ? '#7C5CFF' : colors.card, borderWidth: 0.5, borderColor: category === c ? '#7C5CFF' : colors.border }}>
                <Text style={{ color: category === c ? '#fff' : colors.textMuted, fontSize: 13, fontWeight: '500' }}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      {/* Clubs list */}
      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingTop: 0, paddingBottom: 100, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchClubs(); }} tintColor="#7C5CFF" />}>

        {loading ? <ActivityIndicator color="#7C5CFF" size="large" style={{ marginTop: 40 }} />
          : clubs.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Ionicons name="people-outline" size={48} color={colors.textDim} style={{ marginBottom: 12 }} />
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
                {activeTab === 'my' ? 'No clubs joined yet' : 'No clubs yet'}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
                {activeTab === 'my' ? 'Join clubs to see them here!' : 'Be the first to create a club!'}
              </Text>
              <TouchableOpacity onPress={() => activeTab === 'my' ? setActiveTab('all') : navigation.navigate('CreateClub')}
                style={{ backgroundColor: '#7C5CFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name={activeTab === 'my' ? 'globe-outline' : 'add'} size={16} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '600' }}>
                  {activeTab === 'my' ? 'Browse Clubs' : 'Create Club'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : clubs.map(club => (
            <TouchableOpacity key={club.id}
              onPress={() => navigation.navigate('ClubDetail', { clubId: club.id })}
              activeOpacity={0.75}
              style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 14 }}>

              {/* Icon (emoji chosen by the club creator, so it stays as text) */}
              <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: '#7C5CFF22', alignItems: 'center', justifyContent: 'center' }}>
                {club.icon ? (
                  <Text style={{ fontSize: 26 }}>{club.icon}</Text>
                ) : (
                  <Ionicons name="people" size={24} color="#7C5CFF" />
                )}
              </View>

              {/* Info */}
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 3 }}>{club.name}</Text>
                {club.description ? (
                  <Text style={{ color: colors.textMuted, fontSize: 12, lineHeight: 18 }} numberOfLines={2}>{club.description}</Text>
                ) : null}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <View style={{ backgroundColor: '#7C5CFF22', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                    <Text style={{ color: '#7C5CFF', fontSize: 11 }}>{club.category}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Ionicons name="people-outline" size={12} color={colors.textDim} />
                    <Text style={{ color: colors.textDim, fontSize: 11 }}>{club.members_count} members</Text>
                  </View>
                </View>
              </View>

              {/* Join button */}
              <TouchableOpacity onPress={() => toggleJoin(club.id, club.is_member)}
                style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: club.is_member ? '#7C5CFF22' : '#7C5CFF' }}>
                <Ionicons name={club.is_member ? 'checkmark' : 'add'} size={14} color={club.is_member ? '#7C5CFF' : '#fff'} />
                <Text style={{ color: club.is_member ? '#7C5CFF' : '#fff', fontSize: 12, fontWeight: '700' }}>
                  {club.is_member ? 'Joined' : 'Join'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
      </ScrollView>
    </View>
  );
}