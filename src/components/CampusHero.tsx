import React from 'react';
import { View, Text, TouchableOpacity, ImageBackground, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { thumb } from '../utils/img';
import { prettyCollege } from '../utils/format';
import { useCoverPhoto } from '../utils/coverPhoto';

const HERO = '#2F54EB';

/** The big card on Home: the college name over the college photo from the profile cover. */
export default function CampusHero({ college }: { college?: string }) {
  const { coverUrl, busy, choose } = useCoverPhoto();
  const name = prettyCollege(college) || 'Campus Connect';

  const content = (
    <View style={{ flex: 1, padding: 18, justifyContent: 'flex-end' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 }}>
        <Ionicons name="location" size={12} color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF', fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8 }}>YOUR CAMPUS</Text>
      </View>
      <Text style={{ fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginTop: 8, letterSpacing: -0.4 }} numberOfLines={2}>{name}</Text>
      {coverUrl ? (
        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 3 }} numberOfLines={1}>Marketplace, events, study help and safety</Text>
      ) : (
        <TouchableOpacity onPress={choose} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Add your college photo" style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, marginTop: 10, backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 }}>
          <Ionicons name="image-outline" size={16} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>Add your college photo</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={{ marginHorizontal: 16, borderRadius: 20, overflow: 'hidden', backgroundColor: HERO, height: 175 }}>
      {coverUrl ? (
        <ImageBackground source={{ uri: thumb(coverUrl, 900) }} resizeMode="cover" style={{ flex: 1 }}>
          <LinearGradient colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.7)']} style={{ flex: 1 }}>{content}</LinearGradient>
        </ImageBackground>
      ) : (
        <LinearGradient colors={[HERO, '#7C5CFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>{content}</LinearGradient>
      )}
      <TouchableOpacity
        onPress={choose}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={coverUrl ? 'Change college photo' : 'Add college photo'}
        style={{ position: 'absolute', top: 12, right: 12, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}
      >
        {busy ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={18} color="#fff" />}
      </TouchableOpacity>
    </View>
  );
}
// END OF FILE