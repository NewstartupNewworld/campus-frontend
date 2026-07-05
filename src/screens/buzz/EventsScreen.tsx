import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, RefreshControl, Modal,
  TextInput, Alert, ScrollView, Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '../../theme/ThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = 'https://campus-backend-production-2dbb.up.railway.app';

type EventCategory = 'All' | 'Hackathon' | 'Cultural' | 'Sports' | 'Academic' | 'Workshop' | 'Other';
type EventFilter = 'upcoming' | 'today' | 'this_week' | 'past';

interface CampusEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  startTime: string;
  endTime: string;
  imageUrl?: string;
  college: string;
  rsvpCount: number;
  hasRsvped: boolean;
  isOwner: boolean;
  creatorHandle: string;
}

const CATEGORIES: EventCategory[] = ['All', 'Hackathon', 'Cultural', 'Sports', 'Academic', 'Workshop', 'Other'];

const CATEGORY_COLORS: Record<string, string> = {
  Hackathon: '#4F7CFF', Cultural: '#C97BFF', Sports: '#3DDC84',
  Academic: '#FFB347', Workshop: '#00C9FF', Other: '#94A3B8',
  event: '#4F7CFF', hackathon: '#4F7CFF',
};

const CATEGORY_ICONS: Record<string, string> = {
  Hackathon: '💻', Cultural: '🎭', Sports: '⚽',
  Academic: '📚', Workshop: '🔧', Other: '📌',
  event: '📌', hackathon: '💻',
};

const softShadow = {
  shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
};
const cardShadow = {
  shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.18, shadowRadius: 10, elevation: 5,
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
const getDayName = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { weekday: 'short' });
const getDayNum = (iso: string) => new Date(iso).getDate();
const getMonth = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { month: 'short' });
const isToday = (iso: string) =>
  new Date(iso).toDateString() === new Date().toDateString();
const isTomorrow = (iso: string) => {
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  return new Date(iso).toDateString() === tomorrow.toDateString();
};
const getRelativeDay = (iso: string) => {
  if (isToday(iso)) return 'Today';
  if (isTomorrow(iso)) return 'Tomorrow';
  return getDayName(iso);
};

// Date badge component
const DateBadge = ({ iso }: { iso: string }) => {
  const Colors = useColors();
  const today = isToday(iso);
  return (
    <View style={{ alignItems: 'center', width: 46, minHeight: 52, borderRadius: 14, overflow: 'hidden' }}>
      {today ? (
        <LinearGradient colors={['#4F7CFF', '#7C5CFF']} style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 }}>
          <Text style={{ fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Today</Text>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff', lineHeight: 26 }}>{getDayNum(iso)}</Text>
          <Text style={{ fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.8)' }}>{getMonth(iso)}</Text>
        </LinearGradient>
      ) : (
        <View style={{ flex: 1, width: '100%', backgroundColor: Colors.cardAlt, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 }}>
          <Text style={{ fontSize: 9, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{getDayName(iso)}</Text>
          <Text style={{ fontSize: 22, fontWeight: '900', color: Colors.text, lineHeight: 26 }}>{getDayNum(iso)}</Text>
          <Text style={{ fontSize: 9, fontWeight: '700', color: Colors.textMuted }}>{getMonth(iso)}</Text>
        </View>
      )}
    </View>
  );
};

// Event card
const EventCard = ({ event, onRsvp, onDelete }: {
  event: CampusEvent;
  onRsvp: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const Colors = useColors();
  const [showMenu, setShowMenu] = useState(false);
  const catColor = CATEGORY_COLORS[event.category] ?? Colors.textMuted;
  const catIcon = CATEGORY_ICONS[event.category] ?? '📌';

  return (
    <View style={{ backgroundColor: Colors.card, borderRadius: 18, marginHorizontal: 14, marginBottom: 10, overflow: 'hidden', ...softShadow }}>
      {event.imageUrl && (
        <Image source={{ uri: event.imageUrl }} style={{ width: '100%', height: 140 }} resizeMode="cover" />
      )}
      <View style={{ flexDirection: 'row', gap: 12, padding: 13 }}>
        <DateBadge iso={event.startTime} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: catColor + '18', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 }}>
              <Text style={{ fontSize: 11 }}>{catIcon}</Text>
              <Text style={{ fontSize: 10, fontWeight: '700', color: catColor }}>{event.category}</Text>
            </View>
            {isToday(event.startTime) && (
              <View style={{ marginLeft: 6, backgroundColor: Colors.danger + '18', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: Colors.danger }}>🔴 Today</Text>
              </View>
            )}
            {event.isOwner && (
              <TouchableOpacity style={{ marginLeft: 'auto', padding: 4 }} onPress={() => setShowMenu(true)}>
                <Text style={{ fontSize: 16, color: Colors.textMuted }}>⋮</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={{ fontWeight: '800', fontSize: 14.5, color: Colors.text, marginBottom: 3 }} numberOfLines={2}>
            {event.title}
          </Text>
          <Text style={{ fontSize: 11.5, color: Colors.textMuted, marginBottom: 6 }} numberOfLines={2}>
            {event.description}
          </Text>

          <View style={{ gap: 3, marginBottom: 10 }}>
            <Text style={{ fontSize: 11, color: Colors.textDim }}>
              🕐 {formatTime(event.startTime)} · {getRelativeDay(event.startTime)}
            </Text>
            {event.location && (
              <Text style={{ fontSize: 11, color: Colors.textDim }}>📍 {event.location}</Text>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 11, color: Colors.textMuted }}>
              👤 {event.rsvpCount} interested
            </Text>
            <TouchableOpacity
              onPress={() => onRsvp(event.id)}
              activeOpacity={0.8}
              style={{
                borderRadius: 12, paddingHorizontal: 14, paddingVertical: 7,
                backgroundColor: event.hasRsvped ? Colors.success + '20' : Colors.accent,
                ...softShadow,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: event.hasRsvped ? Colors.success : '#fff' }}>
                {event.hasRsvped ? '✓ Interested' : '+ Interested'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }} activeOpacity={1} onPress={() => setShowMenu(false)}>
          <View style={{ backgroundColor: Colors.card, borderRadius: 16, width: '70%', overflow: 'hidden', ...cardShadow }}>
            <TouchableOpacity style={{ paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center' }} onPress={() => {
              setShowMenu(false);
              Alert.alert('Delete Event', 'Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => onDelete(event.id) },
              ]);
            }}>
              <Text style={{ color: Colors.danger, fontWeight: '700', fontSize: 15 }}>🗑️ Delete Event</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// Create event sheet
const CreateEventSheet = ({ visible, onClose, onCreate }: {
  visible: boolean;
  onClose: () => void;
  onCreate: (data: any) => void;
}) => {
  const Colors = useColors();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('Other');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const reset = () => {
    setTitle(''); setDescription(''); setEventType('Other');
    setLocation(''); setStartDate(''); setStartTime(''); setEndTime('');
  };

  const handleCreate = () => {
    if (!title.trim() || !startDate.trim() || !startTime.trim()) {
      Alert.alert('Missing fields', 'Please fill Title, Date and Start Time.'); return;
    }
    const startISO = new Date(`${startDate}T${startTime}`).toISOString();
    const endISO = endTime
      ? new Date(`${startDate}T${endTime}`).toISOString()
      : new Date(new Date(`${startDate}T${startTime}`).getTime() + 3600000).toISOString();
    onCreate({
      title: title.trim(),
      description: description.trim(),
      eventType,
      location: location.trim(),
      startDate: startISO,
      endDate: endISO,
    });
    reset(); onClose();
  };

  const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32, maxHeight: '92%', ...cardShadow },
    handle: { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
    title: { fontSize: 17, fontWeight: '900', color: Colors.text, marginBottom: 14 },
    label: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 7, marginTop: 12 },
    input: { backgroundColor: Colors.bg, borderRadius: 13, padding: 12, color: Colors.text, fontSize: 14, ...softShadow },
    textArea: { minHeight: 70 },
    pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pill: { backgroundColor: Colors.bg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
    pillActive: { backgroundColor: Colors.accent + '22' },
    pillText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
    row: { flexDirection: 'row', gap: 10 },
    btnRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
    cancelBtn: { flex: 1, backgroundColor: Colors.bg, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
    cancelText: { color: Colors.text, fontWeight: '700' },
    createBtn: { flex: 2, borderRadius: 14, overflow: 'hidden', ...softShadow },
    createBtnGradient: { paddingVertical: 14, alignItems: 'center' },
    createText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  });

  const EVENT_TYPES = ['Hackathon', 'Cultural', 'Sports', 'Academic', 'Workshop', 'Other'];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <ScrollView>
          <View style={s.sheet}>
            <View style={s.handle} />
            <Text style={s.title}>Create Event</Text>

            <Text style={s.label}>Title *</Text>
            <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="e.g. HackIIT 2026" placeholderTextColor={Colors.textDim} maxLength={100} />

            <Text style={s.label}>Type</Text>
            <View style={s.pills}>
              {EVENT_TYPES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[s.pill, eventType === t && s.pillActive, eventType === t && { backgroundColor: (CATEGORY_COLORS[t] ?? Colors.accent) + '22' }]}
                  onPress={() => setEventType(t)}
                >
                  <Text style={[s.pillText, eventType === t && { color: CATEGORY_COLORS[t] ?? Colors.accent, fontWeight: '800' }]}>
                    {CATEGORY_ICONS[t]} {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>Location</Text>
            <TextInput style={s.input} value={location} onChangeText={setLocation} placeholder="e.g. Main Auditorium" placeholderTextColor={Colors.textDim} />

            <Text style={s.label}>Date * (YYYY-MM-DD)</Text>
            <TextInput style={s.input} value={startDate} onChangeText={setStartDate} placeholder="e.g. 2026-07-15" placeholderTextColor={Colors.textDim} keyboardType="numbers-and-punctuation" />

            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Start Time *</Text>
                <TextInput style={s.input} value={startTime} onChangeText={setStartTime} placeholder="14:00" placeholderTextColor={Colors.textDim} keyboardType="numbers-and-punctuation" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>End Time</Text>
                <TextInput style={s.input} value={endTime} onChangeText={setEndTime} placeholder="17:00" placeholderTextColor={Colors.textDim} keyboardType="numbers-and-punctuation" />
              </View>
            </View>

            <Text style={s.label}>Description</Text>
            <TextInput style={[s.input, s.textArea]} value={description} onChangeText={setDescription} placeholder="What's this event about?" placeholderTextColor={Colors.textDim} multiline numberOfLines={3} textAlignVertical="top" maxLength={500} />

            <View style={s.btnRow}>
              <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.createBtn, !title.trim() && { opacity: 0.5 }]}
                onPress={handleCreate}
                disabled={!title.trim()}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#4F7CFF', '#7C5CFF']} style={s.createBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={s.createText}>🎉 Create Event</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

// Main EventsScreen
export const EventsScreen = () => {
  const Colors = useColors();
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<EventCategory>('All');
  const [activeFilter, setActiveFilter] = useState<EventFilter>('upcoming');
  const [createVisible, setCreateVisible] = useState(false);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
    headerTitle: { fontSize: 20, fontWeight: '900', color: Colors.text },
    headerSub: { fontSize: 11.5, color: Colors.textMuted, marginTop: 1 },
    createBtn: { backgroundColor: Colors.accent, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, ...softShadow },
    createBtnText: { color: '#fff', fontWeight: '800', fontSize: 12.5 },
    filterRow: { flexGrow: 0, marginBottom: 4 },
    filterContent: { paddingHorizontal: 14, gap: 7 },
    pill: { backgroundColor: Colors.card, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 6 },
    pillActive: { backgroundColor: Colors.accent },
    pillText: { color: Colors.textMuted, fontSize: 12, fontWeight: '700' },
    pillTextActive: { color: '#fff' },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginBottom: 6 },
    feed: { paddingTop: 4, paddingBottom: 20 },
    emptyIcon: { textAlign: 'center', fontSize: 40, marginTop: 60 },
    empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 12, fontSize: 13 },
  });

  const fetchEvents = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const params = new URLSearchParams();
      if (activeCategory !== 'All') params.append('type', activeCategory);
      if (activeFilter === 'upcoming') params.append('upcoming', 'true');
      const response = await fetch(`${API_URL}/api/events?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events?.map((e: any) => ({
          id: e.id,
          title: e.title,
          description: e.description || '',
          category: e.event_type || 'Other',
          location: e.location || '',
          startTime: e.start_date,
          endTime: e.end_date || e.start_date,
          imageUrl: e.image_url,
          college: e.college || '',
          rsvpCount: parseInt(e.interested_count) || 0,
          hasRsvped: !!e.is_interested,
          isOwner: !!e.is_owner,
          creatorHandle: e.creator_handle || '',
        })) || []);
      }
    } catch (e) {
      console.error('Fetch events error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeCategory, activeFilter]);

  useEffect(() => {
    setLoading(true);
    fetchEvents();
  }, [fetchEvents]);

  const handleRsvp = async (eventId: string) => {
    setEvents(prev => prev.map(e => e.id === eventId
      ? { ...e, hasRsvped: !e.hasRsvped, rsvpCount: e.hasRsvped ? e.rsvpCount - 1 : e.rsvpCount + 1 }
      : e
    ));
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(`${API_URL}/api/events/${eventId}/interest`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) { console.error('Interest error:', e); }
  };

  const handleDelete = async (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(`${API_URL}/api/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) { console.error('Delete event error:', e); }
  };

  const handleCreate = async (data: any) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        fetchEvents();
      } else {
        Alert.alert('Error', 'Failed to create event');
      }
    } catch (e) {
      Alert.alert('Error', 'Check your connection.');
    }
  };

  const filteredEvents = events.filter(e =>
    activeCategory === 'All' || e.category?.toLowerCase() === activeCategory.toLowerCase()
  );

  const FILTERS: { key: EventFilter; label: string }[] = [
    { key: 'upcoming', label: '🗓 Upcoming' },
    { key: 'today', label: '🔴 Today' },
    { key: 'this_week', label: '📅 This Week' },
    { key: 'past', label: '⏪ Past' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🎉 Events</Text>
          <Text style={styles.headerSub}>Hackathons, fests & more</Text>
        </View>
        <TouchableOpacity style={styles.createBtn} onPress={() => setCreateVisible(true)}>
          <Text style={styles.createBtnText}>+ Create</Text>
        </TouchableOpacity>
      </View>

      {/* Time filter */}
      <FlatList
        data={FILTERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={f => f.key}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.pill, activeFilter === item.key && styles.pillActive]}
            onPress={() => setActiveFilter(item.key)}
          >
            <Text style={[styles.pillText, activeFilter === item.key && styles.pillTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Category filter */}
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={c => c}
        style={[styles.filterRow, { marginBottom: 6 }]}
        contentContainerStyle={styles.filterContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.pill, activeCategory === item && (item === 'All' ? styles.pillActive : { backgroundColor: (CATEGORY_COLORS[item] ?? Colors.accent) + '30' })]}
            onPress={() => setActiveCategory(item)}
          >
            <Text style={[styles.pillText, activeCategory === item && { color: item === 'All' ? '#fff' : (CATEGORY_COLORS[item] ?? Colors.accent), fontWeight: '800' }]}>
              {item !== 'All' && (CATEGORY_ICONS[item] ?? '') + ' '}{item}
            </Text>
          </TouchableOpacity>
        )}
      />

      <View style={styles.divider} />

      {loading ? (
        <ActivityIndicator color={Colors.accent} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={e => e.id}
          contentContainerStyle={styles.feed}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchEvents(); }}
              tintColor={Colors.accent}
            />
          }
          renderItem={({ item }) => (
            <EventCard event={item} onRsvp={handleRsvp} onDelete={handleDelete} />
          )}
          ListEmptyComponent={
            <>
              <Text style={styles.emptyIcon}>🎉</Text>
              <Text style={styles.empty}>No events found.{'\n'}Be the first to create one!</Text>
            </>
          }
        />
      )}

      <CreateEventSheet
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onCreate={handleCreate}
      />
    </SafeAreaView>
  );
};