import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, StatusBar, Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '../../theme/ThemeProvider';

const BASE_URL = 'https://campus-backend-production-2dbb.up.railway.app';
const EVENT_TYPES = ['Hackathon', 'Workshop', 'Seminar', 'Cultural', 'Sports', 'Event'];

export default function CreateEventScreen({ navigation }: any) {
  const colors = useColors();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('Event');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [registrationLink, setRegistrationLink] = useState('');
  const [prizePool, setPrizePool] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(false);

  const createEvent = async () => {
    if (!title || !startDate) {
      return Alert.alert('Missing fields', 'Title and start date are required');
    }
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const skills = skillsText.split(',').map(s => s.trim()).filter(Boolean);
      const res = await fetch(`${BASE_URL}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title, description, eventType, location,
          startDate, endDate, registrationLink,
          prizePool, teamSize, skills, isOnline,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      Alert.alert('✅ Posted!', 'Your event is now live', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const TYPE_COLORS: Record<string, string> = {
    Hackathon: '#4F7CFF', Workshop: '#F97316',
    Seminar: '#7C5CFF', Cultural: '#EC4899',
    Sports: '#22C55E', Event: '#94A3B8',
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, gap: 12 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}
          style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.text, fontSize: 18 }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>📅 Post Event</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>

        {/* Event Type */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>
          EVENT TYPE
        </Text>
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
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>TITLE *</Text>
        <TextInput value={title} onChangeText={setTitle}
          placeholder="e.g. SynHack 2026 - 48hr Hackathon"
          placeholderTextColor={colors.textDim}
          style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14, borderWidth: 0.5, borderColor: colors.border, marginBottom: 16 }}
        />

        {/* Description */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>DESCRIPTION</Text>
        <TextInput value={description} onChangeText={setDescription}
          placeholder="Describe the event, rules, eligibility..."
          placeholderTextColor={colors.textDim} multiline numberOfLines={4}
          style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14, borderWidth: 0.5, borderColor: colors.border, marginBottom: 16, minHeight: 100, textAlignVertical: 'top' }}
        />

        {/* Online toggle */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, padding: 14, borderWidth: 0.5, borderColor: colors.border, marginBottom: 16 }}>
          <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500' }}>🌐 Online Event</Text>
          <Switch value={isOnline} onValueChange={setIsOnline} trackColor={{ true: '#22C55E' }} />
        </View>

        {/* Location */}
        {!isOnline && (
          <>
            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>LOCATION</Text>
            <TextInput value={location} onChangeText={setLocation}
              placeholder="e.g. Main Auditorium, IIT Bombay"
              placeholderTextColor={colors.textDim}
              style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14, borderWidth: 0.5, borderColor: colors.border, marginBottom: 16 }}
            />
          </>
        )}

        {/* Dates */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>START DATE & TIME *</Text>
        <TextInput value={startDate} onChangeText={setStartDate}
          placeholder="YYYY-MM-DD HH:MM  e.g. 2026-07-20 10:00"
          placeholderTextColor={colors.textDim}
          style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14, borderWidth: 0.5, borderColor: colors.border, marginBottom: 16 }}
        />

        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>END DATE & TIME</Text>
        <TextInput value={endDate} onChangeText={setEndDate}
          placeholder="YYYY-MM-DD HH:MM  e.g. 2026-07-21 18:00"
          placeholderTextColor={colors.textDim}
          style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14, borderWidth: 0.5, borderColor: colors.border, marginBottom: 16 }}
        />

        {/* Prize pool */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>PRIZE POOL</Text>
        <TextInput value={prizePool} onChangeText={setPrizePool}
          placeholder="e.g. ₹1,00,000 or Free Goodies"
          placeholderTextColor={colors.textDim}
          style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14, borderWidth: 0.5, borderColor: colors.border, marginBottom: 16 }}
        />

        {/* Team size */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>TEAM SIZE</Text>
        <TextInput value={teamSize} onChangeText={setTeamSize}
          placeholder="e.g. 2-4 members or Solo"
          placeholderTextColor={colors.textDim}
          style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14, borderWidth: 0.5, borderColor: colors.border, marginBottom: 16 }}
        />

        {/* Skills */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>SKILLS (comma separated)</Text>
        <TextInput value={skillsText} onChangeText={setSkillsText}
          placeholder="e.g. React, ML, UI/UX, Python"
          placeholderTextColor={colors.textDim}
          style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14, borderWidth: 0.5, borderColor: colors.border, marginBottom: 16 }}
        />

        {/* Registration link */}
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>REGISTRATION LINK</Text>
        <TextInput value={registrationLink} onChangeText={setRegistrationLink}
          placeholder="https://..."
          placeholderTextColor={colors.textDim}
          style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14, borderWidth: 0.5, borderColor: colors.border, marginBottom: 24 }}
        />

        {/* Submit */}
        <TouchableOpacity onPress={createEvent} disabled={loading}
          style={{ backgroundColor: loading ? colors.cardAlt : '#4F7CFF', borderRadius: 16, padding: 16, alignItems: 'center' }}>
          {loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Posting...</Text>
            </View>
          ) : (
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>📅 Post Event</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}