import React from 'react';
import { View, Text, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../theme/ThemeProvider';
import { useAnonDefault } from '../../utils/anonPref';

/** Post anonymously: on shows only your anonymous handle on Buzz posts and comments. */
export default function AnonPostingRow() {
  const colors = useColors();
  const [on, setOn] = useAnonDefault();
  return (
    <View style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 0.5, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
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
  );
}
// END OF FILE