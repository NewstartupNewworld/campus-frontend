import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useColors } from '../../theme/ThemeProvider';
import { SOSButtonMode, getSOSButtonMode, setSOSButtonMode, onSOSButtonModeChange } from '../../utils/sosButton';
import { confirmLogout } from '../../utils/session';
import VerificationRow from './VerificationRow';
import StudyFieldRow from './StudyFieldRow';
import EditProfileRow from './EditProfileRow';
import MyCollegesRow from './MyCollegesRow';
import MessagesRow from './MessagesRow';
import BlockedRow from './BlockedRow';
import AnonPostingRow from './AnonPostingRow';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export default function SettingsScreen() {
  const Colors = useColors();
  const { isDark, toggleTheme } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const [sosMode, setSosMode] = useState<SOSButtonMode>('visible');

  useEffect(() => {
    getSOSButtonMode().then(setSosMode);
    return onSOSButtonModeChange(setSosMode);
  }, []);

  const toggleSOS = (on: boolean) => {
    if (on) { setSOSButtonMode('visible'); return; }
    Alert.alert(
      'Hide the SOS button?',
      'The floating button will disappear. You can still send an alert from Settings, Emergency (SOS).',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Hide', style: 'destructive', onPress: () => setSOSButtonMode('hidden') },
      ]
    );
  };

  const switchProps = (value: boolean) => ({
    value,
    trackColor: { false: Colors.border, true: Colors.accent + '88' },
    thumbColor: value ? Colors.accent : Colors.textMuted,
  });

  const Row = ({ icon, color, label, sub, onPress, right }: { icon: IconName; color: string; label: string; sub?: string; onPress?: () => void; right?: React.ReactNode }) => (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress} activeOpacity={0.7} accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={label}>
      <View style={[styles.rowIcon, { backgroundColor: color + '2E' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {!!sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={Colors.textDim} /> : null)}
    </TouchableOpacity>
  );

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={{ gap: 10 }}>{children}</View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings and activity</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <Section title="Your account">
          <VerificationRow />
          <StudyFieldRow />
          <EditProfileRow onSaved={() => {}} />
          <MyCollegesRow />
        </Section>

        <Section title="How you use CampusConnect">
          <MessagesRow /><AnonPostingRow />
          <View style={styles.settingsCard}>
            <Row icon="notifications" color={Colors.accent} label="Notifications" sub="Likes, comments, chats and alerts" onPress={() => navigation.navigate('Notifications')} />
            <View style={styles.divider} />
            <Row icon="moon" color={Colors.accentAlt} label="Dark mode" right={<Switch {...switchProps(isDark)} onValueChange={toggleTheme} accessibilityLabel="Dark mode" />} />
          </View>
        </Section>

        <Section title="Safety">
          <BlockedRow />
          <View style={styles.settingsCard}>
            <Row icon="warning" color={Colors.danger} label="Show SOS button" sub="Hold it for 2 seconds to send an alert" right={<Switch {...switchProps(sosMode !== 'hidden')} onValueChange={toggleSOS} accessibilityLabel="Show SOS button" />} />
            <View style={styles.divider} />
            <Row icon="alert-circle" color={Colors.danger} label="Emergency (SOS)" sub="Open the emergency screen" onPress={() => navigation.navigate('SOS')} />
            <View style={styles.divider} />
            <Row icon="school" color={Colors.success} label="Cross-college access" sub="Ask to see another college" onPress={() => navigation.navigate('CollegeAccess')} />
          </View>
        </Section>

        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout} accessibilityRole="button">
            <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (Colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6 },
    back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    title: { color: Colors.text, fontSize: 22, fontWeight: '800' },
    section: { paddingHorizontal: 16, marginTop: 18 },
    sectionTitle: { fontSize: 13, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },
    settingsCard: { backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, paddingHorizontal: 14, paddingVertical: 10 },
    rowIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    rowLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },
    rowSub: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
    divider: { height: 1, backgroundColor: Colors.border, marginLeft: 62 },
    logoutBtn: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, backgroundColor: Colors.danger + '1F', borderWidth: 1, borderColor: Colors.danger + '55' },
    logoutText: { color: Colors.danger, fontWeight: '800', fontSize: 14 },
  });
// END OF FILE