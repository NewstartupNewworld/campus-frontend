import { useCallback, useState } from 'react';
import { Alert, AlertButton } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { uploadLocalImage } from './chatUpload';

const API_URL = 'https://campus-backend-arfy.onrender.com';

/** The student's cover photo (a photo of their school or college): the same one Profile shows. */
export function useCoverPhoto() {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/profile/me/extras`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (res.ok) setCoverUrl(json.coverUrl ?? null);
    } catch {
      // Keep what is shown
    }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const save = async (url: string | null) => {
    const token = await AsyncStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/profile/cover`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ coverUrl: url }),
    });
    if (!res.ok) throw new Error('Could not save the photo');
    setCoverUrl(url);
  };

  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission needed', 'Please allow access to your photos.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [16, 9], quality: 0.8 });
    if (result.canceled || result.assets.length === 0) return;
    try {
      setBusy(true);
      const uploaded = await uploadLocalImage(result.assets[0].uri);
      await save(uploaded.url);
    } catch (e: any) {
      Alert.alert('Could not update', e?.message ?? 'Please check your internet and try again.');
    } finally {
      setBusy(false);
    }
  };

  const choose = () => {
    const buttons: AlertButton[] = [{ text: 'Choose a photo', onPress: pick }];
    if (coverUrl) {
      buttons.push({
        text: 'Remove photo', style: 'destructive',
        onPress: () => save(null).catch(() => Alert.alert('Could not remove', 'Please try again.')),
      });
    }
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('College photo', 'Use a photo of your school or college. It shows on Home and on your profile.', buttons);
  };

  return { coverUrl, busy, choose };
}
// END OF FILE