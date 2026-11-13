import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, StatusBar, Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../../theme/ThemeProvider';
import { useKeyboardPadding } from '../../utils/useKeyboardPadding';
import MediaPicker from '../../components/MediaPicker';
import { uploadMedia, PickedMedia } from '../../utils/media';

const BASE_URL = 'https://campus-backend-arfy.onrender.com';
const EVENT_TYPES = ['Hackathon', 'Workshop', 'Seminar', 'Cultural', 'Sports', 'Event'];

const TYPE_COLORS: Record<string, string> = {
  Hackathon: '#4F7CFF', Workshop: '#F97316',
  Seminar: '#7C5CFF', Cultural: '#EC4899',
  Sports: '#22C55E', Event: '#94A3B8',
};

const pad2 = (n: number) => String(n).padStart(2, '0');
// Same text format the server already receives: YYYY-MM-DD HH:MM
const toApi = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
const toShow = (d: Date) =>
  d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// Opens the calendar first, then the clock
const pickDateTime = (current: Date | null, minimum: Date, onPicked: (d: Date) => void) => {
  DateTimePickerAndroid.open({
    value: current ?? new Date(Math.max(minimum.getTime(), Date.now())),
    mode: 'date',
    minimumDate: minimum,
    onChange: (e, date) => {
      if (e.type !== 'set' || !date) return;
      DateTimePickerAndroid.open({
        value: date,
        mode: 'time',
        is24Hour: false,
        onChange: (e2, time) => {
          if (e2.type !== 'set' || !time) return;
          const result = new Date(date);
          result.setHours(time.getHours(), time.getMinutes(), 0, 0);
          onPicked(result);
        },
      });
    },
  });
};

export default function CreateEventScreen({ navigation }: any) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { rootRef, onLayout, pad } = useKeyboardPadding();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('Event');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [registrationLink, setRegistrationLink] = useState('');
  const [prizePool, setPrizePool] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState<PickedMedia | null>(null);

  const createEvent = async () => {
    if (!title.trim() || !startDate) {
      return Alert.alert('Missing fields', 'Title and start date are required');
    }
    if (endDate && endDate.getTime() <= startDate.getTime()) {
      return Alert.alert('Check the dates', 'The end time must be after the start time.');
    }
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const skills = skillsText.split(',').map(s => s.trim()).filter(Boolean);
      const res = await fetch(`${BASE_URL}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: title.trim(), description, eventType, location,
          startDate: toApi(startDate),
          endDate: endDate ? toApi(endDate) : null,
          registrationLink, prizePool, teamSize, skills, isOnline, imageUrl: media ? await uploadMedia(media) : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to create event');
      Alert.alert('Posted!', 'Your event is now live', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = { color: colors.textMuted, fontSize: 12, fontWeight: '600' as const, marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: 0.6 };
  const inputStyle = { backgroundColor: colors.card, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14, borderWidth: 0.5, borderColor: colors.border, marginBottom: 16 };
  const dateBtnStyle = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, backgroundColor: colors.card, borderRadius: 12, padding: 14, borderWidth: 0.5, borderColor: colors.border, marginBottom: 16 };

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return (
    <View
      ref={rootRef}
      collapsable={false}
      onLayout={onLayout}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <View style={{ flex: 1, paddingBottom: pad }}>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: insets.top + 12, paddingBottom: 16, gap: 12 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Go back"
            style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Ionicons name="calendar" size={20} color={colors.text} />
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>Post Event</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        >

          {/* Event Type */}
          <Text style={labelStyle}>EVENT TYPE</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {EVENT_TYPES.map(t => (
              <TouchableOpacity key={t} onPress={() => setEventType(t)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                  backgroundColor: eventType === t ? TYPE_COLORS[t] : colors.card,
                  borderWidth: 0.5, borderColor: eventType === t ? TYPE_COLORS[t] : colors.border,
                }}>
                <Text style={{ color: eventType === t ? '#fff' : colors.textMuted, fontSize: 13, fontWeight: '500' }}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Title */}
          <Text style={labelStyle}>TITLE *</Text>
          <TextInput value={title} onChangeText={setTitle}
            placeholder="e.g. SynHack 2026 - 48hr Hackathon"
            placeholderTextColor={colors.textDim}
            style={inputStyle}
          />

          {/* Description */}
          <Text style={labelStyle}>DESCRIPTION</Text>
          <TextInput value={description} onChangeText={setDescription}
            placeholder="Describe the event, rules, eligibility..."
            placeholderTextColor={colors.textDim} multiline numberOfLines={4}
            style={[inputStyle, { minHeight: 100, textAlignVertical: 'top' }]}
          />

          {/* Online toggle */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, padding: 14, borderWidth: 0.5, borderColor: colors.border, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="globe-outline" size={18} color={colors.text} />
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500' }}>Online Event</Text>
            </View>
            <Switch value={isOnline} onValueChange={setIsOnline} trackColor={{ true: '#22C55E' }} />
          </View>

          {/* Location */}
          {!isOnline && (
            <>
              <Text style={labelStyle}>LOCATION</Text>
              <TextInput value={location} onChangeText={setLocation}
                placeholder="e.g. Main Auditorium, IIT Bombay"
                placeholderTextColor={colors.textDim}
                style={inputStyle}
              />
            </>
          )}

          {/* Dates */}
          <Text style={labelStyle}>START DATE & TIME *</Text>
          <TouchableOpacity
            style={dateBtnStyle}
            onPress={() => pickDateTime(startDate, startOfToday, (d) => {
              setStartDate(d);
              if (endDate && endDate.getTime() <= d.getTime()) setEndDate(null);
            })}
            accessibilityRole="button" accessibilityLabel="Choose start date and time"
          >
            <Ionicons name="calendar-outline" size={18} color={startDate ? colors.text : colors.textDim} />
            <Text style={{ flex: 1, color: startDate ? colors.text : colors.textDim, fontSize: 14 }}>
              {startDate ? toShow(startDate) : 'Tap to choose date and time'}
            </Text>
          </TouchableOpacity>

          <Text style={labelStyle}>END DATE & TIME</Text>
          <View style={[dateBtnStyle, { paddingVertical: 0, paddingHorizontal: 0 }]}>
            <TouchableOpacity
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 }}
              onPress={() => pickDateTime(endDate, startDate ?? startOfToday, setEndDate)}
              accessibilityRole="button" accessibilityLabel="Choose end date and time"
            >
              <Ionicons name="calendar-outline" size={18} color={endDate ? colors.text : colors.textDim} />
              <Text style={{ flex: 1, color: endDate ? colors.text : colors.textDim, fontSize: 14 }}>
                {endDate ? toShow(endDate) : 'Optional. Tap to choose'}
              </Text>
            </TouchableOpacity>
            {endDate ? (
              <TouchableOpacity onPress={() => setEndDate(null)} style={{ padding: 14 }} accessibilityRole="button" accessibilityLabel="Clear end date">
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Prize pool */}
          <Text style={labelStyle}>PRIZE POOL</Text>
          <TextInput value={prizePool} onChangeText={setPrizePool}
            placeholder="e.g. ₹1,00,000 or Free Goodies"
            placeholderTextColor={colors.textDim}
            style={inputStyle}
          />

          {/* Team size */}
          <Text style={labelStyle}>TEAM SIZE</Text>
          <TextInput value={teamSize} onChangeText={setTeamSize}
            placeholder="e.g. 2-4 members or Solo"
            placeholderTextColor={colors.textDim}
            style={inputStyle}
          />

          {/* Skills */}
          <Text style={labelStyle}>SKILLS (comma separated)</Text>
          <TextInput value={skillsText} onChangeText={setSkillsText}
            placeholder="e.g. React, ML, UI/UX, Python"
            placeholderTextColor={colors.textDim}
            style={inputStyle}
          />

          {/* Registration link */}
          <Text style={labelStyle}>REGISTRATION LINK</Text>
          <TextInput value={registrationLink} onChangeText={setRegistrationLink}
            placeholder="https://..."
            placeholderTextColor={colors.textDim}
            autoCapitalize="none" autoCorrect={false} keyboardType="url"
            style={[inputStyle, { marginBottom: 24 }]}
          />

          <Text style={labelStyle}>POSTER (OPTIONAL)</Text>
          <MediaPicker media={media} onChange={setMedia} disabled={loading} />

          {/* Submit */}
          <TouchableOpacity onPress={createEvent} disabled={loading}
            accessibilityRole="button" accessibilityLabel="Post event"
            style={{ backgroundColor: loading ? colors.cardAlt : '#4F7CFF', borderRadius: 16, padding: 16, alignItems: 'center' }}>
            {loading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Posting...</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="calendar" size={16} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Post Event</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}