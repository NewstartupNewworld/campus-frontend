import React from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../theme/ThemeProvider';
import { pickMedia, PickedMedia } from '../utils/media';

/** Camera and gallery buttons with a preview. The parent keeps the chosen photo or video in its own state. */
export default function MediaPicker({
  media, onChange, disabled,
}: {
  media: PickedMedia | null; onChange: (m: PickedMedia | null) => void; disabled?: boolean;
}) {
  const colors = useColors();

  const choose = async (source: 'library' | 'camera') => {
    try {
      const picked = await pickMedia(source);
      if (picked) onChange(picked);
    } catch (e: any) {
      Alert.alert('Cannot use this file', e?.message ?? 'Please choose another one.');
    }
  };

  const button = (icon: React.ComponentProps<typeof Ionicons>['name'], text: string, source: 'library' | 'camera') => (
    <TouchableOpacity
      onPress={() => choose(source)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={text}
      style={{ flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: colors.bg, borderWidth: 0.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}
    >
      <Ionicons name={icon} size={18} color={colors.text} />
      <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>{text}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ marginTop: 10, marginBottom: 6 }}>
      {media ? (
        <View style={{ marginBottom: 10 }}>
          {media.kind === 'image' ? (
            <Image source={{ uri: media.uri }} style={{ width: '100%', height: 160, borderRadius: 14 }} resizeMode="cover" />
          ) : (
            <View style={{ height: 110, borderRadius: 14, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="videocam" size={30} color="#fff" />
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 4 }}>Video selected</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={() => onChange(null)}
            accessibilityRole="button"
            accessibilityLabel="Remove the photo or video"
            style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="close" size={15} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {button('camera-outline', 'Camera', 'camera')}
        {button('images-outline', 'Photo / Video', 'library')}
      </View>
      <Text style={{ color: colors.textDim, fontSize: 11, marginTop: 5 }}>Video: up to 30 seconds and 30 MB.</Text>
    </View>
  );
}
// END OF FILE