import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../theme/ThemeProvider';

const API_URL = 'https://campus-backend-arfy.onrender.com';

/** A row for the Profile screen that opens the inbox and shows how many messages are unread. */
export default function MessagesRow() {
  const colors = useColors();
  const navigation = useNavigation<any>();
  const [unread, setUnread] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          const res = await fetch(`${API_URL}/api/dm`, { headers: { Authorization: `Bearer ${token}` } });
          const data = await res.json();
          if (res.ok && active) {
            setUnread((data.chats ?? []).reduce((sum: number, c: { unread?: number }) => sum + (c.unread ?? 0), 0));
          }
        } catch {
          // Keep the old number
        }
      })();
      return () => { active = false; };
    }, [])
  );

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('DirectChats')}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel="Messages"
      style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 0.5, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}
    >
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#4F7CFF22', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="chatbubbles-outline" size={20} color="#4F7CFF" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}>Messages</Text>
        <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
          {unread > 0 ? `${unread} unread` : 'Chats with other students'}
        </Text>
      </View>
      {unread > 0 ? (
        <View style={{ minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{unread > 9 ? '9+' : unread}</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}