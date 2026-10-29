import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../../theme/ThemeProvider';
import { BuzzScreen } from './BuzzScreen';
import { GroupsScreen } from './GroupsScreen';

type InPage = 'feed' | 'groups';

// Feed and Groups open inside this screen. Events, Clubs, Confessions and People open their own full screens
// (the tab bar keeps highlighting Buzz, and the Android back button returns here).
const CHIPS: { key: string; label: string; route?: string; purple?: boolean }[] = [
  { key: 'feed', label: 'Feed' },
  { key: 'groups', label: 'Groups' },
  { key: 'events', label: 'Events', route: 'Events' },
  { key: 'clubs', label: 'Clubs', route: 'Clubs' },
  { key: 'people', label: 'People', route: 'UserSearch' },
  { key: 'confessions', label: 'Confessions', route: 'Confessions', purple: true },
];

export const BuzzTabScreen = () => {
  const Colors = useColors();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState<InPage>('feed');

  // Home can open Buzz with { tab: 'events' | 'groups' | 'clubs' | 'confessions' }
  useEffect(() => {
    const tab = route.params?.tab;
    if (!tab) return;
    if (tab === 'groups') setActive('groups');
    else if (tab === 'feed') setActive('feed');
    else {
      const chip = CHIPS.find((c) => c.key === tab);
      if (chip?.route) navigation.navigate(chip.route);
    }
    navigation.setParams({ tab: undefined });
  }, [route.params?.tab]);

  const onChipPress = (chip: (typeof CHIPS)[number]) => {
    if (chip.route) navigation.navigate(chip.route);
    else setActive(chip.key as InPage);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg, paddingTop: insets.top },
    chipsScroll: { flexGrow: 0, paddingTop: 10, paddingBottom: 10 },
    chipsContent: { paddingHorizontal: 16, gap: 8 },
    chip: {
      height: 40, borderRadius: 20, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center',
      backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    },
    chipActive: { backgroundColor: '#2F54EB', borderColor: '#2F54EB' },
    chipPurple: { backgroundColor: Colors.accentAlt + '22', borderColor: Colors.accentAlt + '66' },
    chipText: { fontSize: 13.5, fontWeight: '600', color: Colors.textMuted },
    chipTextActive: { fontWeight: '700', color: '#FFFFFF' },
    chipTextPurple: { color: Colors.accentAlt },
    content: { flex: 1 },
  });

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsContent}
      >
        {CHIPS.map((chip) => {
          const isActive = !chip.route && active === chip.key;
          return (
            <TouchableOpacity
              key={chip.key}
              style={[styles.chip, chip.purple && styles.chipPurple, isActive && styles.chipActive]}
              onPress={() => onChipPress(chip)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={chip.label}
            >
              <Text
                style={[
                  styles.chipText,
                  chip.purple && styles.chipTextPurple,
                  isActive && styles.chipTextActive,
                ]}
              >
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.content}>
        {active === 'feed' && <BuzzScreen />}
        {active === 'groups' && <GroupsScreen />}
      </View>
    </View>
  );
};