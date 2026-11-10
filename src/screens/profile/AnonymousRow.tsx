import React, { useCallback, useState } from 'react';
import { View, Text, Switch, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../theme/ThemeProvider';

const API_URL = 'https://campus-backend-arfy.onrender.com';

/** A Profile row: when it is on, your Buzz posts and comments show "Anonymous" and cannot be tapped to open your profile. */
export default function AnonymousRow() {
  const colors = useColors();
  const [on, setOn] = useState(false);
  const [ready, setReady] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          const res = await fetch(`${API_URL}/api/privacy/anonymous`, { headers: { Authorization: `Bearer ${token}` } });
          const data = await res.json();
          if (res.ok && active) {
            setOn(!!data.anonymous);
            setReady(true);
          }
        } catch {
          // Keep what is shown
        }
      })();
      return () => { active = false; };
    }, [])
  );

  const change = async (value: boolean) => {
    setOn(value);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/privacy/anonymous`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ anonymous: value }),
      });
      if (!res.ok) throw new Error('failed');
    } catch {
      setOn(!value);
      Alert.alert('Could not save', 'Please check your internet and try again.');
    }
  };

  return (
    <View
      style={{
        backgroundColor: colors.card, borderColor: colors.border, borderWidth: 0.5, borderRadius: 16,
        padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
      }}
    >
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#7C5CFF22', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="eye-off-outline" size={20} color="#7C5CFF" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}>Anonymous mode</Text>
        <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
          {on ? 'Your posts and comments show "Anonymous"' : 'Your anonymous ID is shown on posts and comments'}
        </Text>
      </View>
      <Switch
        value={on}
        disabled={!ready}
        onValueChange={change}
        trackColor={{ false: colors.border, true: colors.accent + '88' }}
        thumbColor={on ? colors.accent : colors.textMuted}
        accessibilityLabel="Anonymous mode"
      />
    </View>
  );
}