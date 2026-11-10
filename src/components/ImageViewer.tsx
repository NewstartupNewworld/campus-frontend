import React from 'react';
import { Modal, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { thumb } from '../utils/img';

/** Shows one photo full screen. Tap anywhere to close. */
export default function ImageViewer({ uri, onClose }: { uri: string | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  if (!uri) return null;
  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' }}
      >
        <Image source={{ uri: thumb(uri, 1600) }} style={{ width: '100%', height: '85%' }} resizeMode="contain" />
        <TouchableOpacity
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close photo"
          style={{
            position: 'absolute', top: insets.top + 12, right: 16, width: 40, height: 40, borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}