import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../theme/ThemeProvider';

const BASE_URL = 'https://campus-backend-arfy.onrender.com';

type Status = 'unverified' | 'pending' | 'approved' | 'rejected';

const INFO: Record<Status, { label: string; color: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  unverified: { label: 'Not verified. Tap to verify', color: '#F59E0B', icon: 'shield-outline' },
  pending: { label: 'Pending review', color: '#F59E0B', icon: 'time' },
  approved: { label: 'Verified student', color: '#22C55E', icon: 'checkmark-circle' },
  rejected: { label: 'Not approved. Tap to try again', color: '#EF4444', icon: 'close-circle' },
};

export default function VerificationRow() {
  const colors = useColors();
  const navigation = useNavigation<any>();
  const [status, setStatus] = useState<Status | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          const res = await fetch(`${BASE_URL}/api/verification/status`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (active) setStatus(res.ok && data.status ? (data.status as Status) : 'unverified');
        } catch {
          if (active) setStatus('unverified');
        }
      })();
      return () => { active = false; };
    }, [])
  );

  const info = INFO[status ?? 'unverified'];

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Verification')}
      activeOpacity={0.75}
      style={{
        backgroundColor: colors.card, borderColor: colors.border, borderWidth: 0.5,
        borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
      }}
    >
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: info.color + '22', alignItems: 'center', justifyContent: 'center' }}>
        {status === null ? (
          <ActivityIndicator size="small" color={info.color} />
        ) : (
          <Ionicons name={info.icon} size={20} color={info.color} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}>Student verification</Text>
        <Text style={{ color: info.color, fontSize: 12, marginTop: 2 }}>
          {status === null ? 'Checking...' : info.label}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}