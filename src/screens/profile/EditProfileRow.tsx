import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal, ScrollView, ActivityIndicator, Alert,
  DeviceEventEmitter,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../theme/ThemeProvider';
import { useKeyboardPadding } from '../../utils/useKeyboardPadding';

const API_URL = 'https://campus-backend-arfy.onrender.com';

type Form = { student_name: string; department: string; year: string; course: string; field: string };
const EMPTY: Form = { student_name: '', department: '', year: '', course: '', field: '' };

const FIELDS: { key: keyof Form; label: string; placeholder: string; max: number }[] = [
  { key: 'student_name', label: 'Your name', placeholder: 'Only you see this', max: 255 },
  { key: 'department', label: 'Department', placeholder: 'e.g. CSE', max: 100 },
  { key: 'year', label: 'Year / Semester', placeholder: 'e.g. Final year', max: 20 },
  { key: 'course', label: 'Course / Program', placeholder: 'e.g. B.Tech', max: 100 },
  { key: 'field', label: 'Field of interest', placeholder: 'e.g. Web development', max: 100 },
];

/**
 * A row for the Profile screen. Tap it to edit name, department, year, course and field.
 * The college is shown locked and cannot be changed. The same sheet also lets the student
 * delete their account (after typing their password).
 */
export default function EditProfileRow({ onSaved }: { onSaved?: () => void }) {
  const colors = useColors();
  const { rootRef, onLayout, pad } = useKeyboardPadding();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'edit' | 'delete'>('edit');
  const [college, setCollege] = useState('');
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const closeSheet = () => {
    setOpen(false);
    setMode('edit');
    setPassword('');
  };

  const openSheet = async () => {
    try {
      const raw = await AsyncStorage.getItem('user');
      const u = raw ? JSON.parse(raw) : {};
      setCollege(u.college ?? '');
      setForm({
        student_name: u.student_name ?? '',
        department: u.department ?? '',
        year: u.year != null ? String(u.year) : '',
        course: u.course ?? '',
        field: u.field ?? '',
      });
    } catch {
      // Open the sheet with empty fields if the saved profile cannot be read
    }
    setMode('edit');
    setPassword('');
    setOpen(true);
  };

  const setField = (key: keyof Form) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    if (saving) return;
    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/social/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save your profile');

      // Keep the copy saved on the phone in step with the server
      const raw = await AsyncStorage.getItem('user');
      const stored = raw ? JSON.parse(raw) : {};
      await AsyncStorage.setItem('user', JSON.stringify({ ...stored, ...data.user }));

      closeSheet();
      onSaved?.();
    } catch (e: any) {
      Alert.alert('Could not save', e?.message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (!password.trim() || deleting) return;
    try {
      setDeleting(true);
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/social/me`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not delete your account');

      await AsyncStorage.multiRemove(['token', 'user', 'profilePic']);
      closeSheet();
      DeviceEventEmitter.emit('auth:logout');
    } catch (e: any) {
      Alert.alert('Could not delete', e?.message ?? 'Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const labelStyle = { color: colors.textMuted, fontSize: 11, fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: 0.6, marginTop: 14, marginBottom: 8 };

  return (
    <>
      <TouchableOpacity
        onPress={openSheet}
        activeOpacity={0.75}
        style={{
          backgroundColor: colors.card, borderColor: colors.border, borderWidth: 0.5,
          borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
        }}
        accessibilityRole="button"
        accessibilityLabel="Edit profile"
      >
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.accent + '22', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="create-outline" size={20} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}>Edit profile</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>Name, department, year, course</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent statusBarTranslucent onRequestClose={closeSheet}>
        <View
          ref={rootRef}
          collapsable={false}
          onLayout={onLayout}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end', paddingBottom: pad }}
        >
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' }}>
            <View style={{ width: 36, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginTop: 10 }} />
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 20, paddingBottom: 28 }}
            >
              {mode === 'edit' ? (
                <>
                  <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900', marginBottom: 4 }}>Edit profile</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12.5, marginBottom: 6 }}>
                    Other students still see only your anonymous handle.
                  </Text>

                  {/* College: locked */}
                  <Text style={labelStyle}>College</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.bg, borderRadius: 12, padding: 12, opacity: 0.75 }}>
                    <Ionicons name="lock-closed" size={15} color={colors.textMuted} />
                    <Text style={{ flex: 1, color: colors.textMuted, fontSize: 14 }} numberOfLines={1}>{college || 'Your college'}</Text>
                  </View>
                  <Text style={{ color: colors.textDim, fontSize: 11.5, marginTop: 6 }}>
                    College cannot be changed. It decides which students you see.
                  </Text>

                  {FIELDS.map((f) => (
                    <View key={f.key}>
                      <Text style={labelStyle}>{f.label}</Text>
                      <TextInput
                        value={form[f.key]}
                        onChangeText={setField(f.key)}
                        placeholder={f.placeholder}
                        placeholderTextColor={colors.textDim}
                        maxLength={f.max}
                        style={{ backgroundColor: colors.bg, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14 }}
                      />
                    </View>
                  ))}

                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 22 }}>
                    <TouchableOpacity
                      onPress={closeSheet}
                      disabled={saving}
                      style={{ flex: 1, backgroundColor: colors.bg, borderRadius: 14, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Text style={{ color: colors.text, fontWeight: '700' }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={save}
                      disabled={saving}
                      style={{ flex: 2, backgroundColor: colors.accent, borderRadius: 14, minHeight: 48, alignItems: 'center', justifyContent: 'center', opacity: saving ? 0.7 : 1 }}
                    >
                      {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800' }}>Save</Text>}
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={() => setMode('delete')}
                    style={{ marginTop: 18, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    accessibilityRole="button"
                    accessibilityLabel="Delete my account"
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    <Text style={{ color: colors.danger, fontWeight: '700', fontSize: 13.5 }}>Delete my account</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Ionicons name="warning" size={20} color={colors.danger} />
                    <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>Delete your account?</Text>
                  </View>
                  <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 6 }}>
                    This permanently removes your account and the data linked to it, such as your profile,
                    posts, listings and chats. It cannot be undone.
                  </Text>

                  <Text style={labelStyle}>Enter your password to confirm</Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Your password"
                    placeholderTextColor={colors.textDim}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={{ backgroundColor: colors.bg, borderRadius: 12, padding: 12, color: colors.text, fontSize: 14 }}
                  />

                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 22 }}>
                    <TouchableOpacity
                      onPress={() => { setMode('edit'); setPassword(''); }}
                      disabled={deleting}
                      style={{ flex: 1, backgroundColor: colors.bg, borderRadius: 14, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Text style={{ color: colors.text, fontWeight: '700' }}>Keep account</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={deleteAccount}
                      disabled={deleting || !password.trim()}
                      style={{ flex: 1, backgroundColor: colors.danger, borderRadius: 14, minHeight: 48, alignItems: 'center', justifyContent: 'center', opacity: deleting || !password.trim() ? 0.5 : 1 }}
                    >
                      {deleting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800' }}>Delete forever</Text>}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}