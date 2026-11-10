import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, StatusBar, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../../theme/ThemeProvider';

const API_URL = 'https://campus-backend-arfy.onrender.com';

type Row = { id: string; anonymous_handle: string };

export default function BlockedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/safety/blocked`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRows(data.users ?? []);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const unblock = (row: Row) => {
    Alert.alert(`Unblock ${row.anonymous_handle}?`, 'You will see each other again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unblock',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/safety/block/${row.id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('failed');
            setRows((prev) => prev.filter((r) => r.id !== row.id));
          } catch {
            Alert.alert('Could not unblock', 'Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 10 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
          accessibilityRole="button" accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>Blocked students</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 50 }} />
      ) : failed && rows.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 50, paddingHorizontal: 24, gap: 8 }}>
          <Ionicons name="cloud-offline-outline" size={32} color={colors.textMuted} />
          <Text style={{ color: colors.text, fontWeight: '700' }}>Could not load the list</Text>
          <TouchableOpacity
            onPress={() => { setLoading(true); load(); }}
            style={{ marginTop: 8, minHeight: 44, borderRadius: 22, backgroundColor: colors.accent, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60, gap: 8 }}>
              <Ionicons name="checkmark-done-outline" size={40} color={colors.textDim} />
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>You have not blocked anyone.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 10 }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#2F54EB', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>{item.anonymous_handle.slice(0, 2).toUpperCase()}</Text>
              </View>
              <Text style={{ flex: 1, color: colors.text, fontWeight: '700', fontSize: 14.5 }} numberOfLines={1}>{item.anonymous_handle}</Text>
              <TouchableOpacity
                onPress={() => unblock(item)}
                style={{ paddingHorizontal: 14, minHeight: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardAlt }}
                accessibilityRole="button" accessibilityLabel={`Unblock ${item.anonymous_handle}`}
              >
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12.5 }}>Unblock</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}
// END OF FILE