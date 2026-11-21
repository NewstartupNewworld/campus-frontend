import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../theme/ThemeProvider';
import { useStudyProfile } from '../../utils/study';

/** Shows the student's field and opens the screen where they can change it. */
export default function StudyFieldRow() {
  const colors = useColors();
  const navigation = useNavigation<any>();
  const { profile } = useStudyProfile();

  const sub = !profile
    ? 'Tap to choose'
    : profile.autoDetected
    ? `${profile.label} (guessed, tap to confirm)`
    : profile.label;

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('MyField')}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel="My study field"
      style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 0.5, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}
    >
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#F59E0B22', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="sparkles-outline" size={20} color="#F59E0B" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}>My study field</Text>
        <Text style={{ color: profile?.autoDetected ? '#F59E0B' : colors.textMuted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}
// END OF FILE