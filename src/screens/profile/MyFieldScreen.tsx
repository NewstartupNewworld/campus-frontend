import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../../theme/ThemeProvider';
import { useKeyboardPadding } from '../../utils/useKeyboardPadding';
import { apiRequest, alertApiError } from '../../utils/api';
import { CatalogStream, StudyProfileData } from '../../utils/study';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export default function MyFieldScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { rootRef, onLayout, pad } = useKeyboardPadding();

  const [catalog, setCatalog] = useState<CatalogStream[]>([]);
  const [profile, setProfile] = useState<StudyProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState('');
  const [stream, setStream] = useState('other');
  const [customField, setCustomField] = useState('');
  const [program, setProgram] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [semester, setSemester] = useState('');
  const [interestsText, setInterestsText] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);

  const fill = (p: StudyProfileData) => {
    setProfile(p);
    setStream(p.stream);
    setCustomField(p.customField ?? '');
    setProgram(p.program ?? '');
    setSpecialization(p.specialization ?? '');
    setSemester(p.semester ?? '');
    setInterestsText(p.interests.join(', '));
  };

  const load = useCallback(async () => {
    setLoading(true);
    const [c, p] = await Promise.all([
      apiRequest<{ streams: CatalogStream[] }>('/api/study/catalog'),
      apiRequest<{ profile: StudyProfileData }>('/api/study/profile'),
    ]);
    if (c.ok && p.ok) {
      setCatalog(c.data.streams);
      fill(p.data.profile);
      setFailed('');
    } else {
      setFailed(!c.ok ? c.message : !p.ok ? p.message : 'Could not load.');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const current = catalog.find((s) => s.id === stream);

  const save = async () => {
    if (saving) return;
    if (stream === 'other' && !customField.trim()) {
      Alert.alert('Your field', 'Please write the name of your field, for example Marine Biology or Fashion Technology.');
      return;
    }
    setSaving(true);
    const result = await apiRequest<{ profile: StudyProfileData }>('/api/study/profile', {
      method: 'PUT',
      body: {
        stream, customField, program, specialization, semester,
        interests: interestsText.split(',').map((x) => x.trim()).filter(Boolean),
      },
    });
    setSaving(false);
    if (!result.ok) return alertApiError(result);
    fill(result.data.profile);
    Alert.alert('Saved', `Your AI helper, internships and subjects now follow ${result.data.profile.label}.`);
  };

  const addSubject = async () => {
    const name = newSubject.trim();
    if (name.length < 2 || adding) return;
    setAdding(true);
    const result = await apiRequest<{ profile: StudyProfileData }>('/api/study/subjects', { method: 'POST', body: { name } });
    setAdding(false);
    if (!result.ok) return alertApiError(result);
    setProfile(result.data.profile);
    setNewSubject('');
  };

  const removeSubject = async (name: string) => {
    const result = await apiRequest<{ profile: StudyProfileData }>(`/api/study/subjects?name=${encodeURIComponent(name)}`, { method: 'DELETE' });
    if (!result.ok) return alertApiError(result);
    setProfile(result.data.profile);
  };

  const label = { color: colors.textMuted, fontSize: 11, fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: 0.6, marginTop: 20, marginBottom: 8 };
  const input = { backgroundColor: colors.card, borderRadius: 12, padding: 13, color: colors.text, fontSize: 14, borderWidth: 0.5, borderColor: colors.border };
  const chip = (active: boolean) => ({
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18,
    backgroundColor: active ? colors.accent : colors.card, borderWidth: 0.5, borderColor: active ? colors.accent : colors.border,
  });

  return (
    <View ref={rootRef} collapsable={false} onLayout={onLayout} style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <View style={{ flex: 1, paddingBottom: pad > 0 ? pad : insets.bottom }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>My study field</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 50 }} />
        ) : failed ? (
          <View style={{ alignItems: 'center', marginTop: 50, paddingHorizontal: 24, gap: 8 }}>
            <Ionicons name="cloud-offline-outline" size={32} color={colors.textMuted} />
            <Text style={{ color: colors.text, fontWeight: '700' }}>Could not load</Text>
            <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center' }}>{failed}</Text>
            <TouchableOpacity onPress={load} style={{ marginTop: 8, minHeight: 44, borderRadius: 22, backgroundColor: colors.accent, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>
            <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 19 }}>
              The AI helper, internships and subjects in the app follow your field, so a medical student and a law student get different help.
            </Text>

            {profile?.autoDetected ? (
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: '#F59E0B22', borderRadius: 12, padding: 12, marginTop: 14 }}>
                <Ionicons name="sparkles-outline" size={18} color="#F59E0B" />
                <Text style={{ flex: 1, color: colors.text, fontSize: 12.5, lineHeight: 18 }}>
                  We guessed <Text style={{ fontWeight: '800' }}>{profile.label}</Text> from your course. If it is right, tap Save. If not, choose below.
                </Text>
              </View>
            ) : null}

            <Text style={label}>Your field</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {catalog.map((s) => {
                const active = stream === s.id;
                return (
                  <TouchableOpacity key={s.id} onPress={() => setStream(s.id)} style={chip(active)} accessibilityRole="button" accessibilityLabel={s.label}>
                    <Ionicons name={s.icon as IconName} size={15} color={active ? '#fff' : colors.textMuted} />
                    <Text style={{ color: active ? '#fff' : colors.textMuted, fontSize: 12.5, fontWeight: '600' }}>{s.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {stream === 'other' ? (
              <>
                <Text style={label}>Name of your field *</Text>
                <TextInput value={customField} onChangeText={setCustomField} placeholder="e.g. Marine Biology, Fashion Technology" placeholderTextColor={colors.textDim} maxLength={80} style={input} />
              </>
            ) : null}

            <Text style={label}>Course or program</Text>
            <TextInput value={program} onChangeText={setProgram} placeholder="e.g. MBBS, B.Tech CSE, BBA LLB, B.Sc Nursing" placeholderTextColor={colors.textDim} maxLength={60} style={input} />

            <Text style={label}>Specialization (optional)</Text>
            <TextInput value={specialization} onChangeText={setSpecialization} placeholder="e.g. Cardiology, AI and ML, Corporate Law" placeholderTextColor={colors.textDim} maxLength={60} style={input} />

            <Text style={label}>Year or semester (optional)</Text>
            <TextInput value={semester} onChangeText={setSemester} placeholder="e.g. 3rd year, Semester 5" placeholderTextColor={colors.textDim} maxLength={30} style={input} />

            <Text style={label}>Career interests (optional, separate with commas)</Text>
            <TextInput value={interestsText} onChangeText={setInterestsText} placeholder="e.g. startups, research, government job" placeholderTextColor={colors.textDim} maxLength={200} style={input} />

            <TouchableOpacity
              onPress={save}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Save my study field"
              style={{ marginTop: 22, minHeight: 50, borderRadius: 14, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Save</Text>}
            </TouchableOpacity>

            {/* Subjects */}
            <Text style={label}>Your subjects</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(current?.subjects ?? []).map((s) => (
                <View key={s} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: colors.card, borderWidth: 0.5, borderColor: colors.border }}>
                  <Text style={{ color: colors.textMuted, fontSize: 12.5 }}>{s}</Text>
                </View>
              ))}
              {(profile?.customSubjects ?? []).map((s) => (
                <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 12, paddingRight: 8, paddingVertical: 7, borderRadius: 16, backgroundColor: colors.accent + '22', borderWidth: 0.5, borderColor: colors.accent }}>
                  <Text style={{ color: colors.accent, fontSize: 12.5, fontWeight: '600' }}>{s}</Text>
                  <TouchableOpacity onPress={() => removeSubject(s)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel={`Remove ${s}`}>
                    <Ionicons name="close-circle" size={16} color={colors.accent} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            {stream === 'other' && (current?.subjects.length ?? 0) === 0 && (profile?.customSubjects.length ?? 0) === 0 ? (
              <Text style={{ color: colors.textDim, fontSize: 12, marginTop: 6 }}>Add your own subjects below.</Text>
            ) : null}

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TextInput value={newSubject} onChangeText={setNewSubject} placeholder="Add your own subject" placeholderTextColor={colors.textDim} maxLength={60} onSubmitEditing={addSubject} returnKeyType="done" style={{ ...input, flex: 1 }} />
              <TouchableOpacity
                onPress={addSubject}
                disabled={adding || newSubject.trim().length < 2}
                accessibilityRole="button"
                accessibilityLabel="Add subject"
                style={{ width: 48, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', opacity: adding || newSubject.trim().length < 2 ? 0.5 : 1 }}
              >
                {adding ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="add" size={22} color="#fff" />}
              </TouchableOpacity>
            </View>

            {/* Careers */}
            <Text style={label}>Career paths in your field</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(current?.careers ?? []).map((c) => (
                <View key={c} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: colors.card, borderWidth: 0.5, borderColor: colors.border }}>
                  <Text style={{ color: colors.textMuted, fontSize: 12.5 }}>{c}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
}
// END OF FILE