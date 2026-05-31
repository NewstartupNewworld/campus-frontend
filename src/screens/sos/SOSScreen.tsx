import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Linking, Alert, Animated, Vibration, Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { Colors } from '../../theme/colors';

// ─── Types ────────────────────────────────────────────────────────────────────

type AlertSeverity = 'critical' | 'warning' | 'info';

interface SOSAlert {
  id: string;
  type: string;
  message: string;
  location: string;
  reportedBy: string;       // anonymous
  severity: AlertSeverity;
  createdAt: string;
  resolved: boolean;
  respondersCount: number;
}

interface QuickContact {
  label: string;
  number: string;
  icon: string;
  color: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const QUICK_CONTACTS: QuickContact[] = [
  { label: 'Campus Security', number: '1800-XXX-0001', icon: '🛡️', color: Colors.accent },
  { label: 'Ambulance',       number: '108',           icon: '🚑', color: Colors.danger },
  { label: 'Police',          number: '100',           icon: '👮', color: '#4F8CFF' },
  { label: 'Warden',          number: '1800-XXX-0002', icon: '🏠', color: Colors.warn },
  { label: 'Fire',            number: '101',           icon: '🔥', color: '#FF6B35' },
  { label: 'Women Helpline',  number: '1091',          icon: '💜', color: '#C97BFF' },
];

const MOCK_ALERTS: SOSAlert[] = [
  {
    id: '1', type: 'Medical Emergency',
    message: 'Student collapsed near Library Block B. Medical help needed urgently.',
    location: 'Library Block B', reportedBy: 'Anonymous#14',
    severity: 'critical', createdAt: new Date(Date.now() - 300000).toISOString(),
    resolved: false, respondersCount: 3,
  },
  {
    id: '2', type: 'Suspicious Activity',
    message: 'Unknown person loitering near Girls Hostel gate since 30 mins.',
    location: "Girls' Hostel Gate", reportedBy: 'Anonymous#88',
    severity: 'warning', createdAt: new Date(Date.now() - 1800000).toISOString(),
    resolved: false, respondersCount: 1,
  },
  {
    id: '3', type: 'Power Outage',
    message: 'Complete power failure in Academic Block 3. Lifts not working.',
    location: 'Academic Block 3', reportedBy: 'Anonymous#31',
    severity: 'info', createdAt: new Date(Date.now() - 7200000).toISOString(),
    resolved: true, respondersCount: 5,
  },
];

const ALERT_TYPES = [
  'Medical Emergency', 'Fire', 'Suspicious Activity',
  'Harassment', 'Power Outage', 'Flood / Waterlogging', 'Other',
];

const severityColor = (s: AlertSeverity) =>
  s === 'critical' ? Colors.danger : s === 'warning' ? Colors.warn : Colors.accent;

const severityIcon = (s: AlertSeverity) =>
  s === 'critical' ? '🚨' : s === 'warning' ? '⚠️' : 'ℹ️';

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
};

// ─── Pulsing SOS Button ───────────────────────────────────────────────────────

const PulsingSOSButton = ({ onPress, active }: { onPress: () => void; active: boolean }) => {
  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const pulse3 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) {
      pulse1.setValue(1); pulse2.setValue(1); pulse3.setValue(1);
      return;
    }
    const makeLoop = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 2.2, duration: 1200, useNativeDriver: true }),
          Animated.timing(val, { toValue: 1, duration: 0, useNativeDriver: true }),
        ])
      );
    const a1 = makeLoop(pulse1, 0);
    const a2 = makeLoop(pulse2, 400);
    const a3 = makeLoop(pulse3, 800);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [active]);

  return (
    <View style={btn.wrap}>
      {active && (
        <>
          <Animated.View style={[btn.ring, { transform: [{ scale: pulse1 }], opacity: pulse1.interpolate({ inputRange: [1, 2.2], outputRange: [0.4, 0] }) }]} />
          <Animated.View style={[btn.ring, { transform: [{ scale: pulse2 }], opacity: pulse2.interpolate({ inputRange: [1, 2.2], outputRange: [0.3, 0] }) }]} />
          <Animated.View style={[btn.ring, { transform: [{ scale: pulse3 }], opacity: pulse3.interpolate({ inputRange: [1, 2.2], outputRange: [0.2, 0] }) }]} />
        </>
      )}
      <TouchableOpacity
        style={[btn.button, active && btn.buttonActive]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <Text style={btn.icon}>{active ? '✕' : '🚨'}</Text>
        <Text style={btn.label}>{active ? 'CANCEL SOS' : 'SOS'}</Text>
        <Text style={btn.sublabel}>{active ? 'Alert is live' : 'Hold to send alert'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const btn = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', height: 220, marginVertical: 8 },
  ring: {
    position: 'absolute',
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: Colors.danger,
  },
  button: {
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: Colors.card,
    borderWidth: 3, borderColor: Colors.danger,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.danger, shadowOpacity: 0.5,
    shadowRadius: 20, elevation: 12,
  },
  buttonActive: { backgroundColor: Colors.danger },
  icon: { fontSize: 36, marginBottom: 4 },
  label: { fontSize: 20, fontWeight: '900', color: Colors.text, letterSpacing: 2 },
  sublabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 3 },
});

// ─── Alert Type Picker ────────────────────────────────────────────────────────

const AlertTypePicker = ({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (t: string) => void;
}) => (
  <View style={atp.wrap}>
    <Text style={atp.label}>Alert Type</Text>
    <View style={atp.grid}>
      {ALERT_TYPES.map(t => (
        <TouchableOpacity
          key={t}
          style={[atp.pill, selected === t && atp.pillActive]}
          onPress={() => onSelect(t)}
        >
          <Text style={[atp.pillText, selected === t && atp.pillTextActive]}>{t}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const atp = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    backgroundColor: Colors.card, borderRadius: 20, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 6,
  },
  pillActive: { backgroundColor: Colors.danger + '22', borderColor: Colors.danger + '88' },
  pillText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  pillTextActive: { color: Colors.danger, fontWeight: '700' },
});

// ─── Quick Contact Card ───────────────────────────────────────────────────────

const ContactCard = ({ contact }: { contact: QuickContact }) => (
  <TouchableOpacity
    style={[cc.card, { borderColor: contact.color + '44' }]}
    onPress={() => Linking.openURL(`tel:${contact.number}`)}
    activeOpacity={0.8}
  >
    <Text style={cc.icon}>{contact.icon}</Text>
    <Text style={cc.label}>{contact.label}</Text>
    <Text style={[cc.number, { color: contact.color }]}>{contact.number}</Text>
  </TouchableOpacity>
);

const cc = StyleSheet.create({
  card: {
    width: '47%', backgroundColor: Colors.card, borderRadius: 14,
    borderWidth: 1, padding: 14, alignItems: 'center', gap: 4,
  },
  icon: { fontSize: 26 },
  label: { fontSize: 12, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  number: { fontSize: 12, fontWeight: '800' },
});

// ─── Alert Feed Card ──────────────────────────────────────────────────────────

const AlertCard = ({ alert, onRespond }: { alert: SOSAlert; onRespond: (id: string) => void }) => {
  const color = severityColor(alert.severity);
  return (
    <View style={[ac.card, { borderColor: color + '44', opacity: alert.resolved ? 0.5 : 1 }]}>
      <View style={ac.cardHeader}>
        <Text style={{ fontSize: 18 }}>{severityIcon(alert.severity)}</Text>
        <View style={ac.headerText}>
          <Text style={[ac.type, { color }]}>{alert.type}</Text>
          <Text style={ac.meta}>📍 {alert.location} • {timeAgo(alert.createdAt)}</Text>
        </View>
        {alert.resolved
          ? <View style={ac.resolvedBadge}><Text style={ac.resolvedText}>✓ Resolved</Text></View>
          : <View style={[ac.liveBadge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
              <View style={[ac.liveDot, { backgroundColor: color }]} />
              <Text style={[ac.liveText, { color }]}>Live</Text>
            </View>
        }
      </View>
      <Text style={ac.message}>{alert.message}</Text>
      <View style={ac.footer}>
        <Text style={ac.reporter}>Reported by {alert.reportedBy}</Text>
        {!alert.resolved && (
          <TouchableOpacity
            style={[ac.respondBtn, { borderColor: color + '66', backgroundColor: color + '18' }]}
            onPress={() => onRespond(alert.id)}
          >
            <Text style={[ac.respondText, { color }]}>
              🙋 Responding ({alert.respondersCount})
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const ac = StyleSheet.create({
  card: {
    backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1,
    marginBottom: 10, padding: 14,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  headerText: { flex: 1 },
  type: { fontWeight: '800', fontSize: 14 },
  meta: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  resolvedBadge: {
    backgroundColor: Colors.success + '22', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.success + '44',
  },
  resolvedText: { fontSize: 10, fontWeight: '700', color: Colors.success },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 10, fontWeight: '700' },
  message: { fontSize: 13, color: Colors.text, lineHeight: 20, marginBottom: 10 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reporter: { fontSize: 11, color: Colors.textDim },
  respondBtn: {
    borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5,
  },
  respondText: { fontSize: 11, fontWeight: '700' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const SOSScreen = () => {
  const [sosActive, setSosActive] = useState(false);
  const [alertType, setAlertType] = useState('Medical Emergency');
  const [location, setLocation] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<SOSAlert[]>(MOCK_ALERTS);
  const [countdown, setCountdown] = useState(5);
  const [countingDown, setCountingDown] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Get location on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      // Reverse geocode for a human-readable label
      const geo = await Location.reverseGeocodeAsync(loc.coords);
      if (geo.length > 0) {
        const g = geo[0];
        setLocation([g.name, g.street, g.district].filter(Boolean).join(', '));
      }
    })();
  }, []);

  const handleSOSPress = () => {
    if (sosActive) {
      // Cancel
      setSosActive(false);
      setCountingDown(false);
      if (countdownRef.current) clearInterval(countdownRef.current);
      setCountdown(5);
      Vibration.cancel();
      // api.post('/sos/cancel', { ... })
      return;
    }

    // Start 5-second countdown before sending
    setCountingDown(true);
    setCountdown(5);
    Vibration.vibrate([0, 200, 100, 200]);

    let remaining = 5;
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(countdownRef.current!);
        setCountingDown(false);
        setSosActive(true);
        sendSOS();
      }
    }, 1000);
  };

  const sendSOS = async () => {
    Vibration.vibrate([0, 500, 200, 500, 200, 500]);

    // Add to local alerts feed
    const newAlert: SOSAlert = {
      id: Date.now().toString(),
      type: alertType,
      message: `Emergency reported near ${location ?? 'campus'}. Immediate help needed.`,
      location: location ?? 'Campus',
      reportedBy: 'You (Anonymous)',
      severity: alertType === 'Medical Emergency' || alertType === 'Fire' ? 'critical' : 'warning',
      createdAt: new Date().toISOString(),
      resolved: false,
      respondersCount: 0,
    };
    setAlerts(prev => [newAlert, ...prev]);

    // Replace with real API call:
    // await api.post('/sos', {
    //   type: alertType,
    //   latitude: coords.latitude,
    //   longitude: coords.longitude,
    // });
    // socket.emit('sos_alert', newAlert);
  };

  const handleCancelCountdown = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountingDown(false);
    setCountdown(5);
    Vibration.cancel();
  };

  const handleRespond = (id: string) => {
    setAlerts(prev => prev.map(a =>
      a.id === id ? { ...a, respondersCount: a.respondersCount + 1 } : a
    ));
    // api.post(`/sos/${id}/respond`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🚨 SOS</Text>
          <Text style={styles.headerSub}>Campus Emergency Network</Text>
        </View>

        {/* Location status */}
        <View style={styles.locationBar}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText} numberOfLines={1}>
            {location ?? 'Getting your location...'}
          </Text>
          <View style={[styles.locationDot, { backgroundColor: location ? Colors.success : Colors.warn }]} />
        </View>

        {/* Countdown overlay */}
        {countingDown && (
          <View style={styles.countdownCard}>
            <Text style={styles.countdownNum}>{countdown}</Text>
            <Text style={styles.countdownLabel}>Sending SOS in {countdown}s</Text>
            <TouchableOpacity style={styles.cancelCountdown} onPress={handleCancelCountdown}>
              <Text style={styles.cancelCountdownText}>✕ Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SOS Button */}
        {!countingDown && (
          <>
            <PulsingSOSButton onPress={handleSOSPress} active={sosActive} />

            {sosActive && (
              <View style={styles.activeAlert}>
                <Text style={styles.activeAlertText}>
                  🔴 Your SOS is live — nearby students & security have been notified
                </Text>
              </View>
            )}

            {/* Alert type picker — only when not active */}
            {!sosActive && (
              <View style={styles.section}>
                <AlertTypePicker selected={alertType} onSelect={setAlertType} />
              </View>
            )}
          </>
        )}

        {/* Quick Contacts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Contacts</Text>
          <View style={styles.contactsGrid}>
            {QUICK_CONTACTS.map(c => <ContactCard key={c.label} contact={c} />)}
          </View>
        </View>

        {/* Active Alerts Feed */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Campus Alerts</Text>
            <View style={styles.liveIndicator}>
              <View style={styles.livePulse} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>
          {alerts.map(a => (
            <AlertCard key={a.id} alert={a} onRespond={handleRespond} />
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: 30 },

  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: Colors.text },
  headerSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  locationBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: Colors.card, borderRadius: 10, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 9,
  },
  locationIcon: { fontSize: 14 },
  locationText: { flex: 1, fontSize: 12, color: Colors.textMuted },
  locationDot: { width: 8, height: 8, borderRadius: 4 },

  countdownCard: {
    marginHorizontal: 16, marginVertical: 20,
    backgroundColor: Colors.danger + '18', borderRadius: 20,
    borderWidth: 2, borderColor: Colors.danger + '66',
    alignItems: 'center', padding: 30,
  },
  countdownNum: { fontSize: 80, fontWeight: '900', color: Colors.danger, lineHeight: 90 },
  countdownLabel: { fontSize: 16, color: Colors.text, fontWeight: '700', marginBottom: 20 },
  cancelCountdown: {
    backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: 24, paddingVertical: 10,
  },
  cancelCountdownText: { color: Colors.text, fontWeight: '700', fontSize: 14 },

  activeAlert: {
    marginHorizontal: 16, marginBottom: 14,
    backgroundColor: Colors.danger + '18', borderRadius: 12,
    borderWidth: 1, borderColor: Colors.danger + '44',
    padding: 12,
  },
  activeAlertText: { color: Colors.danger, fontSize: 13, fontWeight: '600', textAlign: 'center', lineHeight: 20 },

  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 12 },

  contactsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },

  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  livePulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.danger },
  liveText: { fontSize: 11, fontWeight: '700', color: Colors.danger },
});
