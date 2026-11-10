import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../theme/ThemeProvider';

/** A Profile row that opens the list of students you blocked. */
export default function BlockedRow() {
  const colors = useColors();
  const navigation = useNavigation<any>();
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Blocked')}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel="Blocked students"
      style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 0.5, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}
    >
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#EF444422', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="ban-outline" size={20} color="#EF4444" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}>Blocked students</Text>
        <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>See and unblock</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}