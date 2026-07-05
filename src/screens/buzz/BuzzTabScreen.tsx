import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { useColors } from '../../theme/ThemeProvider';
import { BuzzScreen } from './BuzzScreen';
import { GroupsScreen } from './GroupsScreen';
import { EventsScreen } from './EventsScreen';

export const BuzzTabScreen = () => {
  const Colors = useColors();
  const [activeTab, setActiveTab] = useState<'feed' | 'groups' | 'events'>('feed');

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    tabBar: {
      flexDirection: 'row', backgroundColor: Colors.card,
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'android' ? 24 : 12,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
    },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabActive: { borderBottomColor: Colors.accent },
    tabText: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
    tabTextActive: { color: Colors.accent },
    content: { flex: 1 },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabBar}>
        {([
          { key: 'feed', label: '⚡ Feed' },
          { key: 'groups', label: '👥 Groups' },
          { key: 'events', label: '🎉 Events' },
        ] as const).map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.content}>
        {activeTab === 'feed' && <BuzzScreen />}
        {activeTab === 'groups' && <GroupsScreen />}
        {activeTab === 'events' && <EventsScreen />}
      </View>
    </SafeAreaView>
  );
};