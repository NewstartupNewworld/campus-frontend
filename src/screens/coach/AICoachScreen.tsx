import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../../theme/ThemeProvider';
import { apiRequest } from '../../utils/api';
import { CoachSkill, COACH_NOTE } from '../../utils/coach';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
const KIND_LABEL: Record<string, string> = { chat: 'Live practice', report: 'Report', test: 'Timed test' };

export default function AICoachScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [field, setField] = useState('');
  const [skills, setSkills] = useState<CoachSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const result = await apiRequest<{ field: string; skills: CoachSkill[] }>('/api/coach/skills');
    if (result.ok) {
      setField(result.data.field);
      setSkills(result.data.skills);
      setError('');
    } else {
      setError(result.message);
    }
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800' }}>AI Coach</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 50 }} />
      ) : error ? (
        <View style={{ alignItems: 'center', marginTop: 50, paddingHorizontal: 24, gap: 8 }}>
          <Ionicons name="cloud-offline-outline" size={32} color={colors.textMuted} />
          <Text style={{ color: colors.text, fontWeight: '700' }}>Could not load the coach</Text>
          <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center' }}>{error}</Text>
          <TouchableOpacity onPress={() => { setLoading(true); load(); }} style={{ marginTop: 8, minHeight: 44, borderRadius: 22, backgroundColor: colors.accent, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 12 }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('MyField')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Change my study field"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.accent + '1F', borderRadius: 14, padding: 12 }}
          >
            <Ionicons name="sparkles-outline" size={18} color={colors.accent} />
            <Text style={{ flex: 1, color: colors.text, fontSize: 13 }}>
              Made for <Text style={{ fontWeight: '800' }}>{field}</Text>. Tap to change your field.
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          {skills.map((s) => (
            <TouchableOpacity
              key={s.id}
              onPress={() => navigation.navigate('CoachSkill', { skill: s })}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={s.title}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 14 }}
            >
              <View style={{ width: 50, height: 50, borderRadius: 15, backgroundColor: s.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={s.icon as IconName} size={24} color={s.color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ color: colors.text, fontSize: 15.5, fontWeight: '700', flexShrink: 1 }}>{s.title}</Text>
                  <View style={{ backgroundColor: s.color + '22', borderRadius: 7, paddingHorizontal: 7, paddingVertical: 2 }}>
                    <Text style={{ color: s.color, fontSize: 10, fontWeight: '800' }}>{KIND_LABEL[s.kind] ?? ''}</Text>
                  </View>
                </View>
                <Text style={{ color: colors.textMuted, fontSize: 12.5, lineHeight: 17, marginTop: 3 }}>{s.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
            </TouchableOpacity>
          ))}
          <Text style={{ color: colors.textDim, fontSize: 11, textAlign: 'center', marginTop: 8, lineHeight: 16 }}>{COACH_NOTE}</Text>
        </ScrollView>
      )}
    </View>
  );
}
// END OF FILE