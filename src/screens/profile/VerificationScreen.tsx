import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator,
  Image, StatusBar, SafeAreaView, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../theme/ThemeProvider';
import { uploadLocalImage } from '../../utils/chatUpload';

const BASE_URL = 'https://campus-backend-arfy.onrender.com';

type Status = 'unverified' | 'pending' | 'approved' | 'rejected';

export default function VerificationScreen({ navigation }: any) {
  const colors = useColors();
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const getToken = async () => await AsyncStorage.getItem('token');

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/api/verification/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.status) setStatus(data.status as Status);
      else setStatus('unverified');
    } catch {
      setStatus('unverified');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to upload your ID card.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!result.canceled && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const submit = async () => {
    if (!photoUri) return;
    try {
      setSubmitting(true);
      const uploaded = await uploadLocalImage(photoUri);
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/api/verification/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ idCardUrl: uploaded.url }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Could not submit', data.error ?? 'Please try again.');
        return;
      }
      setPhotoUri(null);
      setStatus('pending');
    } catch (e: any) {
      Alert.alert('Could not submit', e?.message ?? 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const StatusCard = ({ icon, color, title, body }: { icon: React.ComponentProps<typeof Ionicons>['name']; color: string; title: string; body: string }) => (
    <View style={{ backgroundColor: color + '18', borderColor: color + '55', borderWidth: 1, borderRadius: 16, padding: 18, alignItems: 'center' }}>
      <Ionicons name={icon} size={44} color={color} style={{ marginBottom: 10 }} />
      <Text style={{ color: colors.text, fontSize: 17, fontWeight: '700', marginBottom: 6, textAlign: 'center' }}>{title}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 20, textAlign: 'center' }}>{body}</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, gap: 10 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>Student verification</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100, gap: 16 }} showsVerticalScrollIndicator={false}>
        {loading || status === null ? (
          <ActivityIndicator color={colors.accent} size="large" style={{ marginTop: 40 }} />
        ) : status === 'approved' ? (
          <StatusCard
            icon="checkmark-circle" color="#22C55E"
            title="You are verified"
            body="Your student ID has been approved. You have full access to your campus."
          />
        ) : status === 'pending' ? (
          <>
            <StatusCard
              icon="time" color="#F59E0B"
              title="Verification pending"
              body="Your ID card has been submitted and is being reviewed. Check back soon."
            />
            <TouchableOpacity onPress={fetchStatus}
              style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 0.5, borderRadius: 14, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
              <Ionicons name="refresh" size={16} color={colors.text} />
              <Text style={{ color: colors.text, fontWeight: '600' }}>Check status</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {status === 'rejected' ? (
              <StatusCard
                icon="close-circle" color="#EF4444"
                title="Verification was not approved"
                body="Please upload a clearer photo of your college ID card, with your name and college visible."
              />
            ) : (
              <View style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 0.5, borderRadius: 16, padding: 18 }}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 6 }}>Verify you are a student</Text>
                <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 20 }}>
                  Upload a clear photo of your college ID card. Your name and college should be readable.
                  We use it only to check that you are a student.
                </Text>
              </View>
            )}

            {photoUri ? (
              <Image source={{ uri: photoUri }} resizeMode="contain"
                style={{ width: '100%', height: 220, borderRadius: 14, backgroundColor: colors.card }} />
            ) : null}

            <TouchableOpacity onPress={pickPhoto} disabled={submitting}
              style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 0.5, borderRadius: 14, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
              <Ionicons name="image-outline" size={18} color={colors.text} />
              <Text style={{ color: colors.text, fontWeight: '600' }}>{photoUri ? 'Choose a different photo' : 'Choose ID card photo'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={submit} disabled={!photoUri || submitting}
              style={{ backgroundColor: photoUri ? colors.accent : colors.card, opacity: photoUri ? 1 : 0.5, borderRadius: 14, padding: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Submit for verification</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}