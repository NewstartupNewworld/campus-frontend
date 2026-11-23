import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../theme/ThemeProvider';
import { useAnonDefault } from '../../utils/anonPref';
import { apiRequest, alertApiError } from '../../utils/api';

/** Post anonymously: on shows only your anonymous handle on Buzz posts and comments. */
export default function AnonPostingRow() {
  const colors = useColors();
  const [on, setOn] = useAnonDefault();
  const [busy, setBusy] = useState(false);

  const makeOld = () => {
    Alert.alert(
      'Make your old posts anonymous?',
      'All your earlier Buzz posts and comments will show only your anonymous handle. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Make anonymous',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            const r = await apiRequest<{ posts: number; comments: number }>('/api/buzz/anonymize-all', { method: 'POST' });
            setBusy(false);
            if (!r.ok) return alertApiError(r);
            Alert.alert('Done', `${r.data.posts} posts and ${r.data.comments} comments are now anonymous.`);
          },
        },
      ]
    );
  };

  return (
    <View style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 0.5, borderRadius: 16, padding: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#7C5CFF22', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={on ? 'eye-off' : 'eye-outline'} size={20} color="#7C5CFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}>Post anonymously</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 2 }}>
            {on
              ? 'Your new Buzz posts and comments show only your anonymous handle. You can change it for each post.'
              : 'Your Buzz posts and comments show your name. Turn on to use your anonymous handle.'}
          </Text>
        </View>
        <Switch
          value={on}
          onValueChange={setOn}
          trackColor={{ false: colors.border, true: colors.accent + '88' }}
          thumbColor={on ? colors.accent : colors.textMuted}
          accessibilityLabel="Post anonymously"
        />
      </View>
      <TouchableOpacity
        onPress={makeOld}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel="Make my old posts anonymous"
        style={{ marginTop: 12, minHeight: 40, justifyContent: 'center', alignSelf: 'flex-start' }}
      >
        {busy ? <ActivityIndicator size="small" color={colors.accent} /> : <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 13 }}>Make my old posts anonymous</Text>}
      </TouchableOpacity>
    </View>
  );
}
// END OF FILE