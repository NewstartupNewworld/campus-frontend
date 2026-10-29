import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StatusBar, RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../theme/ThemeProvider';

const BASE_URL = 'https://campus-backend-arfy.onrender.com';

const EVENT_TYPES = ['All', 'Hackathon', 'Workshop', 'Seminar', 'Cultural', 'Sports', 'Event'];

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TYPE_CONFIG: Record<string, { icon: IconName; color: string; bg: string }> = {
  Hackathon: { icon: 'code-slash', color: '#4F7CFF', bg: '#4F7CFF22' },
  Workshop:  { icon: 'construct', color: '#F97316', bg: '#F9731622' },
  Seminar:   { icon: 'mic', color: '#7C5CFF', bg: '#7C5CFF22' },
  Cultural:  { icon: 'color-palette', color: '#EC4899', bg: '#EC489922' },
  Sports:    { icon: 'football', color: '#22C55E', bg: '#22C55E22' },
  Event:     { icon: 'calendar', color: '#94A3B8', bg: '#94A3B822' },
};

type Event = {
  id: number;
  title: string;
  description: string;
  event_type: string;
  location: string;
  start_date: string;
  end_date: string;
  registration_link: string;
  prize_pool: string;
  team_size: string;
  skills: string[];
  is_online: boolean;
  interested_count: number;
  is_interested: boolean;
  creator_handle: string;
  college: string;
};

export default function EventsScreen({ navigation }: any) {
  const colors = useColors();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All');
  const [upcomingOnly, setUpcomingOnly] = useState(true);
  const [onlyInterested, setOnlyInterested] = useState(false);

  useEffect(() => { fetchEvents(); }, [type, upcomingOnly]);

  const getToken = async () => await AsyncStorage.getItem('token');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const params = new URLSearchParams();
      if (type !== 'All') params.append('type', type);
      if (search) params.append('search', search);
      if (upcomingOnly) params.append('upcoming', 'true');

      const res = await fetch(`${BASE_URL}/api/events?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch (err) {
      console.error('Fetch events error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleInterest = async (id: number) => {
    try {
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/api/events/${id}/interest`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setEvents(prev => prev.map(e => e.id === id ? {
        ...e,
        is_interested: data.interested,
        interested_count: data.interested ? e.interested_count + 1 : e.interested_count - 1,
      } : e));
    } catch { }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getDaysLeft = (date: string) => {
    const diff = new Date(date).getTime() - Date.now();
    const days = Math.ceil(diff / 86400000);
    if (days < 0) return 'Ended';
    if (days === 0) return 'Today!';
    if (days === 1) return 'Tomorrow';
    return `${days} days left`;
  };

  const getDaysLeftColor = (date: string) => {
    const diff = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
    if (diff <= 0) return colors.textDim;
    if (diff <= 3) return '#EF4444';
    if (diff <= 7) return '#F97316';
    return '#22C55E';
  };

  const shown = onlyInterested ? events.filter(e => e.is_interested) : events;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ color: colors.text, fontSize: 26, fontWeight: '700' }}>Events</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateEvent')}
            style={{ backgroundColor: '#4F7CFF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Post</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ color: colors.textMuted, fontSize: 14 }}>Hackathons, workshops & more</Text>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <TextInput
          value={search} onChangeText={setSearch}
          placeholder="Search events..." placeholderTextColor={colors.textDim}
          onSubmitEditing={fetchEvents}
          style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14, borderWidth: 0.5, borderColor: colors.border }}
        />
      </View>

      {/* Filters row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 8, gap: 8 }}>
        <TouchableOpacity
          onPress={() => setUpcomingOnly(!upcomingOnly)}
          style={{
            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 5,
            backgroundColor: upcomingOnly ? '#22C55E' : colors.card,
            borderWidth: 0.5, borderColor: upcomingOnly ? '#22C55E' : colors.border,
          }}>
          <Ionicons name="calendar-outline" size={13} color={upcomingOnly ? '#fff' : colors.textMuted} />
          <Text style={{ color: upcomingOnly ? '#fff' : colors.textMuted, fontSize: 12, fontWeight: '600' }}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setOnlyInterested(!onlyInterested)}
          style={{
            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 5,
            backgroundColor: onlyInterested ? '#F59E0B' : colors.card,
            borderWidth: 0.5, borderColor: onlyInterested ? '#F59E0B' : colors.border,
          }}>
          <Ionicons name={onlyInterested ? 'star' : 'star-outline'} size={13} color={onlyInterested ? '#fff' : colors.textMuted} />
          <Text style={{ color: onlyInterested ? '#fff' : colors.textMuted, fontSize: 12, fontWeight: '600' }}>Interested</Text>
        </TouchableOpacity>
      </View>

      {/* Type chips */}
      <ScrollView horizontal style={{ flexGrow: 0 }} showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 12 }}>
        {EVENT_TYPES.map(t => {
          const config = TYPE_CONFIG[t];
          const active = type === t;
          return (
            <TouchableOpacity key={t} onPress={() => setType(t)}
              style={{
                paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
                backgroundColor: active ? (config?.color ?? '#4F7CFF') : colors.card,
                borderWidth: 0.5, borderColor: active ? (config?.color ?? '#4F7CFF') : colors.border,
                flexDirection: 'row', alignItems: 'center', gap: 5,
              }}>
              {config ? <Ionicons name={config.icon} size={13} color={active ? '#fff' : colors.textMuted} /> : null}
              <Text style={{ color: active ? '#fff' : colors.textMuted, fontSize: 13, fontWeight: '500' }}>{t}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Events list */}
      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingTop: 0, paddingBottom: 100, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEvents(); }} tintColor={colors.accent} />}>

        {loading ? (
          <ActivityIndicator color={colors.accent} size="large" style={{ marginTop: 40 }} />
        ) : shown.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <Ionicons name="calendar-outline" size={48} color={colors.textDim} style={{ marginBottom: 12 }} />
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 8 }}>No events found</Text>
            <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
              {onlyInterested ? 'You have not marked any event as interested.' : 'Be the first to post an event or hackathon!'}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('CreateEvent')}
              style={{ backgroundColor: '#4F7CFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '600' }}>Post Event</Text>
            </TouchableOpacity>
          </View>
        ) : shown.map(event => {
          const config = TYPE_CONFIG[event.event_type] ?? TYPE_CONFIG['Event'];
          return (
            <TouchableOpacity key={event.id}
              onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
              activeOpacity={0.75}
              style={{ backgroundColor: colors.card, borderRadius: 18, overflow: 'hidden', borderWidth: 0.5, borderColor: colors.border }}>

              {/* Top color bar */}
              <View style={{ height: 4, backgroundColor: config.color }} />

              <View style={{ padding: 16 }}>
                {/* Type + Days left */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ backgroundColor: config.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name={config.icon} size={12} color={config.color} />
                      <Text style={{ color: config.color, fontSize: 11, fontWeight: '600' }}>{event.event_type}</Text>
                    </View>
                    {event.is_online ? (
                      <View style={{ backgroundColor: '#22C55E22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="globe-outline" size={12} color="#22C55E" />
                        <Text style={{ color: '#22C55E', fontSize: 11, fontWeight: '600' }}>Online</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={{ color: getDaysLeftColor(event.start_date), fontSize: 12, fontWeight: '700' }}>
                    {getDaysLeft(event.start_date)}
                  </Text>
                </View>

                {/* Title */}
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 6 }} numberOfLines={2}>
                  {event.title}
                </Text>

                {/* Description */}
                {event.description ? (
                  <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 18, marginBottom: 10 }} numberOfLines={2}>
                    {event.description}
                  </Text>
                ) : null}

                {/* Info chips */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  <View style={{ backgroundColor: colors.cardAlt, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
                    <Text style={{ color: colors.textMuted, fontSize: 11 }}>{formatDate(event.start_date)}</Text>
                  </View>
                  {event.location ? (
                    <View style={{ backgroundColor: colors.cardAlt, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                      <Text style={{ color: colors.textMuted, fontSize: 11 }}>{event.location}</Text>
                    </View>
                  ) : null}
                  {event.prize_pool ? (
                    <View style={{ backgroundColor: '#22C55E22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="trophy-outline" size={12} color="#22C55E" />
                      <Text style={{ color: '#22C55E', fontSize: 11, fontWeight: '600' }}>{event.prize_pool}</Text>
                    </View>
                  ) : null}
                  {event.team_size ? (
                    <View style={{ backgroundColor: colors.cardAlt, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="people-outline" size={12} color={colors.textMuted} />
                      <Text style={{ color: colors.textMuted, fontSize: 11 }}>{event.team_size}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Footer */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: colors.textDim, fontSize: 11 }}>
                    {event.interested_count} interested · by {event.creator_handle}
                  </Text>
                  <TouchableOpacity
                    onPress={() => toggleInterest(event.id)}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 5,
                      backgroundColor: event.is_interested ? config.color : colors.cardAlt,
                    }}>
                    <Ionicons name={event.is_interested ? 'star' : 'star-outline'} size={13} color={event.is_interested ? '#fff' : colors.textMuted} />
                    <Text style={{ color: event.is_interested ? '#fff' : colors.textMuted, fontSize: 12, fontWeight: '600' }}>
                      {event.is_interested ? 'Interested' : 'Interest'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}