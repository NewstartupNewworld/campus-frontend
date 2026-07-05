import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, StatusBar, Linking, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '../../theme/ThemeProvider';

const BASE_URL = 'https://campus-backend-production-2dbb.up.railway.app';

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  Hackathon: { icon: '💻', color: '#4F7CFF', bg: '#4F7CFF22' },
  Workshop:  { icon: '🔧', color: '#F97316', bg: '#F9731622' },
  Seminar:   { icon: '🎤', color: '#7C5CFF', bg: '#7C5CFF22' },
  Cultural:  { icon: '🎭', color: '#EC4899', bg: '#EC489922' },
  Sports:    { icon: '⚽', color: '#22C55E', bg: '#22C55E22' },
  Event:     { icon: '📅', color: '#94A3B8', bg: '#94A3B822' },
};

export default function EventDetailScreen({ route, navigation }: any) {
  const { eventId } = route.params;
  const colors = useColors();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchEvent(); }, []);

  const getToken = async () => await AsyncStorage.getItem('token');

  const fetchEvent = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setEvent(data.event);
    } catch { } finally { setLoading(false); }
  };

  const toggleInterest = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/api/events/${eventId}/interest`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setEvent((prev: any) => ({
        ...prev,
        is_interested: data.interested,
        interested_count: data.interested ? prev.interested_count + 1 : prev.interested_count - 1,
      }));
    } catch { }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const getDaysLeft = (date: string) => {
    const days = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
    if (days < 0) return 'Event Ended';
    if (days === 0) return 'Today!';
    if (days === 1) return 'Tomorrow!';
    return `${days} days left`;
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.textMuted }}>Event not found</Text>
      </View>
    );
  }

  const config = TYPE_CONFIG[event.event_type] ?? TYPE_CONFIG['Event'];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, gap: 12 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}
          style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.text, fontSize: 18 }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', flex: 1 }} numberOfLines={1}>
          {event.title}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>

        {/* Color banner */}
        <View style={{ height: 6, backgroundColor: config.color, borderRadius: 4, marginBottom: 20 }} />

        {/* Type + Online badge */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <View style={{ backgroundColor: config.bg, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 14 }}>{config.icon}</Text>
            <Text style={{ color: config.color, fontSize: 13, fontWeight: '700' }}>{event.event_type}</Text>
          </View>
          {event.is_online && (
            <View style={{ backgroundColor: '#22C55E22', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 }}>
              <Text style={{ color: '#22C55E', fontSize: 13, fontWeight: '600' }}>🌐 Online</Text>
            </View>
          )}
          <View style={{ backgroundColor: `${config.color}22`, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, marginLeft: 'auto' }}>
            <Text style={{ color: config.color, fontSize: 13, fontWeight: '700' }}>{getDaysLeft(event.start_date)}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 12, lineHeight: 30 }}>
          {event.title}
        </Text>

        {/* Info cards */}
        <View style={{ gap: 10, marginBottom: 20 }}>
          {/* Date & Time */}
          <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#4F7CFF22', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 20 }}>📅</Text>
            </View>
            <View>
              <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' }}>Date & Time</Text>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>{formatDate(event.start_date)}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>{formatTime(event.start_date)}
                {event.end_date ? ` — ${formatTime(event.end_date)}` : ''}
              </Text>
            </View>
          </View>

          {/* Location */}
          {event.location && (
            <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#F9731622', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 20 }}>📍</Text>
              </View>
              <View>
                <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' }}>Location</Text>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>{event.location}</Text>
              </View>
            </View>
          )}

          {/* Prize pool */}
          {event.prize_pool && (
            <View style={{ backgroundColor: '#22C55E15', borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: '#22C55E33', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#22C55E22', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 20 }}>🏆</Text>
              </View>
              <View>
                <Text style={{ color: '#22C55E', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' }}>Prize Pool</Text>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>{event.prize_pool}</Text>
              </View>
            </View>
          )}

          {/* Team size */}
          {event.team_size && (
            <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#7C5CFF22', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 20 }}>👥</Text>
              </View>
              <View>
                <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' }}>Team Size</Text>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>{event.team_size}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Description */}
        {event.description && (
          <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: colors.border, marginBottom: 16 }}>
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 8 }}>About</Text>
            <Text style={{ color: colors.textMuted, fontSize: 14, lineHeight: 22 }}>{event.description}</Text>
          </View>
        )}

        {/* Skills */}
        {event.skills?.length > 0 && (
          <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: colors.border, marginBottom: 16 }}>
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 10 }}>Skills Required</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {event.skills.map((s: string, i: number) => (
                <View key={i} style={{ backgroundColor: config.bg, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 }}>
                  <Text style={{ color: config.color, fontSize: 12, fontWeight: '500' }}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Posted by */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: config.bg, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: config.color, fontSize: 10, fontWeight: '700' }}>
              {event.creator_handle?.slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <Text style={{ color: colors.textDim, fontSize: 12 }}>
            Posted by {event.creator_handle} · {event.interested_count} interested
          </Text>
        </View>
      </ScrollView>

      {/* Bottom buttons */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 36, backgroundColor: colors.bg, borderTopWidth: 0.5, borderTopColor: colors.border, flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity
          onPress={toggleInterest}
          style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: event.is_interested ? config.color : colors.card, borderWidth: 0.5, borderColor: event.is_interested ? config.color : colors.border, alignItems: 'center' }}>
          <Text style={{ color: event.is_interested ? '#fff' : colors.textMuted, fontSize: 15, fontWeight: '700' }}>
            {event.is_interested ? '⭐ Interested' : '+ Mark Interest'}
          </Text>
        </TouchableOpacity>

        {event.registration_link && (
          <TouchableOpacity
            onPress={() => Linking.openURL(event.registration_link)}
            style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: config.color, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Register →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}