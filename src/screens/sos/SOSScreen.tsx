import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, Alert,
  Animated, Vibration, TextInput, Modal, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '../../theme/ThemeProvider';

const API_URL = 'https://campus-backend-arfy.onrender.com';
const COUNTDOWN_SECONDS = 5;
const ALERT_TYPES = [
  'Medical Emergency', 'Fire', 'Suspicious Activity', 'Harassment',
  'Power Outage', 'Flood / Waterlogging', 'Other',
];

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type AlertSeverity = 'critical' | 'warning' | 'info';

interface SOSAlert {
  id: string; type: string; message: string; location: string;
  reportedBy: string; severity: AlertSeverity; createdAt: string;
  resolved: boolean; respondersCount: number;
}

interface QuickContact {
  label: string; number: string; icon: IconName; color: string;
}

const DEFAULT_CONTACTS: QuickContact[] = [
  { label: 'Campus Security', number: '1800-XXX-0001', icon: 'shield-checkmark', color: '#4F7CFF' },
  { label: 'Ambulance', number: '108', icon: 'medkit', color: '#EF4444' },
  { label: 'Police', number: '100', icon: 'shield', color: '#4F8CFF' },
  { label: 'Warden', number: '1800-XXX-0002', icon: 'home', color: '#F97316' },
  { label: 'Fire', number: '101', icon: 'flame', color: '#FF6B35' },
  { label: 'Women Helpline', number: '1091', icon: 'heart', color: '#C97BFF' },
];

const isPlaceholder = (n: string) => /x/i.test(n);

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
};

// Pulsing manual SOS button (tap to start the countdown)
const PulsingSOSButton = ({ onPress, active }: { onPress: () => void; active: boolean }) => {
  const Colors = useColors();
  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const pulse3 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) { pulse1.setValue(1); pulse2.setValue(1); pulse3.setValue(1); return; }
    const makeLoop = (val: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(val, { toValue: 2.2, duration: 1200, useNativeDriver: true }),
        Animated.timing(val, { toValue: 1, duration: 0, useNativeDriver: true }),
      ]));
    const a1 = makeLoop(pulse1, 0);
    const a2 = makeLoop(pulse2, 400);
    const a3 = makeLoop(pulse3, 800);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [active]);

  const s = StyleSheet.create({
    wrap: { alignItems: 'center', justifyContent: 'center', height: 220, marginVertical: 8 },
    ring: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: Colors.danger },
    button: {
      width: 160, height: 160, borderRadius: 80, backgroundColor: Colors.card,
      borderWidth: 3, borderColor: Colors.danger, alignItems: 'center', justifyContent: 'center',
    },
    buttonActive: { backgroundColor: Colors.danger },
    label: { fontSize: 20, fontWeight: '900', color: Colors.text, letterSpacing: 2, marginTop: 4 },
    sublabel: { fontSize: 11, color: Colors.textMuted, marginTop: 3 },
  });

  return (
    <View style={s.wrap}>
      {active && (
        <>
          <Animated.View style={[s.ring, { transform: [{ scale: pulse1 }], opacity: pulse1.interpolate({ inputRange: [1, 2.2], outputRange: [0.4, 0] }) }]} />
          <Animated.View style={[s.ring, { transform: [{ scale: pulse2 }], opacity: pulse2.interpolate({ inputRange: [1, 2.2], outputRange: [0.3, 0] }) }]} />
          <Animated.View style={[s.ring, { transform: [{ scale: pulse3 }], opacity: pulse3.interpolate({ inputRange: [1, 2.2], outputRange: [0.2, 0] }) }]} />
        </>
      )}
      <TouchableOpacity
        style={[s.button, active && s.buttonActive]}
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={active ? 'Cancel SOS' : 'Send SOS alert'}
      >
        <Ionicons name={active ? 'close' : 'warning'} size={38} color={active ? '#FFFFFF' : Colors.danger} />
        <Text style={[s.label, active && { color: '#FFFFFF' }]}>{active ? 'CANCEL' : 'SOS'}</Text>
        <Text style={[s.sublabel, active && { color: 'rgba(255,255,255,0.8)' }]}>
          {active ? 'Alert is live' : 'Tap to send alert'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const AlertTypePicker = ({ selected, onSelect }: { selected: string; onSelect: (t: string) => void }) => {
  const Colors = useColors();
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
        Alert type
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {ALERT_TYPES.map((t) => {
          const on = selected === t;
          return (
            <TouchableOpacity
              key={t}
              style={{
                minHeight: 40, justifyContent: 'center', borderRadius: 20, paddingHorizontal: 14,
                backgroundColor: on ? Colors.danger + '2E' : Colors.card,
                borderWidth: 1, borderColor: on ? Colors.danger : Colors.border,
              }}
              onPress={() => onSelect(t)}
              accessibilityRole="button"
            >
              <Text style={{ fontSize: 12.5, fontWeight: on ? '700' : '600', color: on ? Colors.danger : Colors.textMuted }}>{t}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const ContactCard = ({ contact, onEdit }: { contact: QuickContact; onEdit: () => void }) => {
  const Colors = useColors();
  const placeholder = isPlaceholder(contact.number);
  return (
    <TouchableOpacity
      style={{
        width: '48%', backgroundColor: Colors.card, borderRadius: 16, padding: 14,
        alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Colors.border,
      }}
      onPress={() => (placeholder ? onEdit() : Linking.openURL(`tel:${contact.number.replace(/[-\s]/g, '')}`))}
      onLongPress={onEdit}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${contact.label}, ${placeholder ? 'number not set' : contact.number}`}
    >
      <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: contact.color + '2E', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={contact.icon} size={22} color={contact.color} />
      </View>
      <Text style={{ fontSize: 12.5, fontWeight: '700', color: Colors.text, textAlign: 'center' }}>{contact.label}</Text>
      <Text style={{ fontSize: 12.5, fontWeight: '800', color: placeholder ? Colors.textMuted : contact.color }}>
        {placeholder ? 'Set number' : contact.number}
      </Text>
      <Text style={{ fontSize: 10, color: Colors.textMuted, marginTop: 1 }}>Hold to edit</Text>
    </TouchableOpacity>
  );
};

const AlertCard = ({ alert, onRespond }: { alert: SOSAlert; onRespond: (id: string) => void }) => {
  const Colors = useColors();
  const color = alert.severity === 'critical' ? Colors.danger : alert.severity === 'warning' ? Colors.warn : Colors.accent;
  const icon: IconName = alert.severity === 'critical' ? 'alert-circle' : alert.severity === 'warning' ? 'warning' : 'information-circle';
  return (
    <View style={{ backgroundColor: Colors.card, borderRadius: 16, marginBottom: 10, padding: 14, opacity: alert.resolved ? 0.55 : 1, borderWidth: 1, borderColor: Colors.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
        <Ionicons name={icon} size={20} color={color} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '800', fontSize: 13.5, color }}>{alert.type}</Text>
          <Text style={{ fontSize: 11.5, color: Colors.textMuted, marginTop: 2 }}>{alert.location}  |  {timeAgo(alert.createdAt)}</Text>
        </View>
        {alert.resolved ? (
          <View style={{ backgroundColor: Colors.success + '2E', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ fontSize: 10.5, fontWeight: '700', color: Colors.success }}>Resolved</Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: color + '2E', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
            <Text style={{ fontSize: 10.5, fontWeight: '700', color }}>Live</Text>
          </View>
        )}
      </View>
      <Text style={{ fontSize: 13, color: Colors.text, lineHeight: 19, marginBottom: 10 }}>{alert.message}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 11.5, color: Colors.textMuted }}>Reported by {alert.reportedBy}</Text>
        {!alert.resolved && (
          <TouchableOpacity
            style={{ minHeight: 40, justifyContent: 'center', backgroundColor: color + '2E', borderRadius: 12, paddingHorizontal: 12 }}
            onPress={() => onRespond(alert.id)}
            accessibilityRole="button"
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color }}>I am responding ({alert.respondersCount})</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export const SOSScreen = ({ route }: any) => {
  const Colors = useColors();
  const insets = useSafeAreaInsets();
  const [sosActive, setSosActive] = useState(false);
  const [alertType, setAlertType] = useState('Medical Emergency');
  const [location, setLocation] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [countingDown, setCountingDown] = useState(false);
  const [contacts, setContacts] = useState<QuickContact[]>(DEFAULT_CONTACTS);
  const [editingContact, setEditingContact] = useState<QuickContact | null>(null);
  const [editNumber, setEditNumber] = useState('');
  const [editModal, setEditModal] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Always read the newest values when the alert is actually sent (5 s after pressing)
  const latest = useRef({ alertType, location, coords, contacts });
  latest.current = { alertType, location, coords, contacts };

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({});
        setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        const geo = await Location.reverseGeocodeAsync(loc.coords);
        if (geo.length > 0) {
          const g = geo[0];
          setLocation([g.name, g.street, g.district].filter(Boolean).join(', '));
        }
      } catch (e) {}
    })();
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('quickContacts');
        if (saved) {
          const parsed: { label: string; number: string }[] = JSON.parse(saved);
          setContacts(DEFAULT_CONTACTS.map((d) => ({
            ...d,
            number: parsed.find((p) => p.label === d.label)?.number ?? d.number,
          })));
        }
      } catch (e) {}
    })();
    fetchAlerts();
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      Vibration.cancel();
    };
  }, []);

  // Opened by holding the floating SOS button: pick type is already done, start the countdown
  useEffect(() => {
    const p = route?.params;
    if (p?.autoSend && p?.nonce) {
      const type = p.alertType || 'Medical Emergency';
      setAlertType(type);
      latest.current = { ...latest.current, alertType: type };
      setSosActive(false);
      startCountdown();
    }
  }, [route?.params?.nonce]);

  const fetchAlerts = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/sos/alerts`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (response.ok && data.alerts) {
        setAlerts(data.alerts.map((a: any) => ({
          id: a.id, type: a.type, message: a.message,
          location: a.location_label || 'Campus', reportedBy: a.reported_by || 'Anonymous',
          severity: a.severity, createdAt: a.created_at, resolved: a.resolved,
          respondersCount: parseInt(a.responders_count) || 0,
        })));
      }
    } catch (e) {
      console.error('Failed to fetch alerts:', e);
    } finally {
      setLoadingAlerts(false);
    }
  };

  const startCountdown = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountingDown(true);
    setCountdown(COUNTDOWN_SECONDS);
    Vibration.vibrate([0, 200, 100, 200]);
    let remaining = COUNTDOWN_SECONDS;
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        countdownRef.current = null;
        setCountingDown(false);
        setSosActive(true);
        sendSOS();
      }
    }, 1000);
  };

  const handleSOSPress = () => {
    if (sosActive) {
      setSosActive(false);
      Vibration.cancel();
      return;
    }
    startCountdown();
  };

  const handleCancelCountdown = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = null;
    setCountingDown(false);
    setCountdown(COUNTDOWN_SECONDS);
    Vibration.cancel();
  };

  const sendSOS = async () => {
    const { alertType: type, location: loc, coords: pos } = latest.current;
    const message = `Emergency reported near ${loc ?? 'campus'}. Immediate help needed.`;
    Vibration.vibrate([0, 500, 200, 500, 200, 500]);
    let ok = false;
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type, message,
          latitude: pos?.latitude ?? null, longitude: pos?.longitude ?? null,
          locationLabel: loc ?? 'Campus',
        }),
      });
      const data = await response.json();
      if (response.ok) {
        ok = true;
        setAlerts((prev) => [{
          id: data.id, type, message, location: loc ?? 'Campus', reportedBy: 'You (Anonymous)',
          severity: type === 'Medical Emergency' || type === 'Fire' ? 'critical' : type === 'Other' ? 'info' : 'warning',
          createdAt: new Date().toISOString(), resolved: false, respondersCount: 0,
        }, ...prev]);
      }
    } catch (e) {
      console.error('SOS send error:', e);
    }
    if (!ok) await sendSMSFallback();
  };

  const sendSMSFallback = async () => {
    try {
      const { alertType: type, location: loc, coords: pos, contacts: list } = latest.current;
      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('SOS not sent', 'Could not send the alert online, and SMS is not available on this device. Please call 112.');
        return;
      }
      const mapsLink = pos ? `https://maps.google.com/?q=${pos.latitude},${pos.longitude}` : '';
      const text = `SOS: ${type}\nLocation: ${loc ?? 'Unknown'}\n${mapsLink}\nThis is an automated emergency alert from CampusConnect.`;
      const recipients = list
        .filter((c) => /^\d{3,}$/.test(c.number.replace(/[-\s]/g, '')))
        .map((c) => c.number.replace(/[-\s]/g, ''));
      await SMS.sendSMSAsync(recipients, text);
    } catch (e) {
      console.error('SMS fallback error:', e);
    }
  };

  const handleRespond = async (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, respondersCount: a.respondersCount + 1 } : a)));
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(`${API_URL}/api/sos/${id}/respond`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    } catch (e) {
      console.error('Respond error:', e);
    }
  };

  const handleEditContact = (contact: QuickContact) => {
    setEditingContact(contact);
    setEditNumber(isPlaceholder(contact.number) ? '' : contact.number);
    setEditModal(true);
  };

  const handleSaveContact = async () => {
    if (!editingContact) return;
    const updated = contacts.map((c) => (c.label === editingContact.label ? { ...c, number: editNumber.trim() || c.number } : c));
    setContacts(updated);
    await AsyncStorage.setItem('quickContacts', JSON.stringify(updated.map((c) => ({ label: c.label, number: c.number }))));
    setEditModal(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, paddingTop: insets.top }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 }}>
          <Text style={{ fontSize: 26, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 }}>Emergency</Text>
          <Text style={{ fontSize: 13, color: Colors.textMuted, marginTop: 2 }}>Campus emergency network</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginBottom: 10, backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 12 }}>
          <Ionicons name="location" size={18} color={location ? Colors.success : Colors.warn} />
          <Text style={{ flex: 1, fontSize: 13, color: Colors.textMuted }} numberOfLines={1}>
            {location ?? 'Getting your location...'}
          </Text>
        </View>

        {countingDown && (
          <View style={{ marginHorizontal: 16, marginVertical: 20, backgroundColor: Colors.danger + '1F', borderRadius: 20, borderWidth: 1, borderColor: Colors.danger + '66', alignItems: 'center', padding: 30 }}>
            <Text style={{ fontSize: 80, fontWeight: '900', color: Colors.danger, lineHeight: 90 }}>{countdown}</Text>
            <Text style={{ fontSize: 16, color: Colors.text, fontWeight: '700', marginBottom: 6 }}>Sending {alertType} alert in {countdown}s</Text>
            <Text style={{ fontSize: 12.5, color: Colors.textMuted, marginBottom: 18 }}>Pressed by mistake? Cancel now.</Text>
            <TouchableOpacity
              style={{ minHeight: 48, justifyContent: 'center', backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 28 }}
              onPress={handleCancelCountdown}
              accessibilityRole="button"
            >
              <Text style={{ color: Colors.text, fontWeight: '700', fontSize: 15 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {!countingDown && (
          <>
            <PulsingSOSButton onPress={handleSOSPress} active={sosActive} />
            {sosActive && (
              <View style={{ marginHorizontal: 16, marginBottom: 14, backgroundColor: Colors.danger + '1F', borderRadius: 14, padding: 12 }}>
                <Text style={{ color: Colors.danger, fontSize: 13, fontWeight: '700', textAlign: 'center', lineHeight: 20 }}>
                  Your alert is live. Students on your campus can see it.
                </Text>
                <Text style={{ color: Colors.textMuted, fontSize: 12.5, textAlign: 'center', marginTop: 4 }}>
                  If you are in danger, also call 112.
                </Text>
              </View>
            )}
            {!sosActive && (
              <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
                <AlertTypePicker selected={alertType} onSelect={setAlertType} />
              </View>
            )}
          </>
        )}

        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <TouchableOpacity
            style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.danger, borderRadius: 14 }}
            onPress={() => Linking.openURL('tel:112')}
            accessibilityRole="button"
          >
            <Ionicons name="call" size={18} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>Call 112 (emergency)</Text>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <TouchableOpacity
            style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.warn + '24', borderRadius: 14, borderWidth: 1, borderColor: Colors.warn + '66' }}
            onPress={sendSMSFallback}
            accessibilityRole="button"
          >
            <Ionicons name="chatbox-ellipses" size={18} color={Colors.warn} />
            <Text style={{ color: Colors.warn, fontWeight: '700', fontSize: 13.5 }}>Send SOS by SMS (no internet needed)</Text>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 4 }}>Quick contacts</Text>
          <Text style={{ fontSize: 12, color: Colors.textMuted, marginBottom: 12 }}>Tap to call. Hold a card to change its number.</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 10, justifyContent: 'space-between' }}>
            {contacts.map((c) => <ContactCard key={c.label} contact={c} onEdit={() => handleEditContact(c)} />)}
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.text }}>Campus alerts</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.danger }} />
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: Colors.danger }}>Live</Text>
            </View>
          </View>
          {loadingAlerts ? (
            <ActivityIndicator color={Colors.danger} style={{ marginVertical: 20 }} />
          ) : alerts.length === 0 ? (
            <Text style={{ textAlign: 'center', color: Colors.textMuted, paddingVertical: 20, fontSize: 13 }}>No active alerts on campus.</Text>
          ) : (
            alerts.map((a) => <AlertCard key={a.id} alert={a} onRespond={handleRespond} />)
          )}
        </View>
      </ScrollView>

      <Modal visible={editModal} transparent animationType="fade" onRequestClose={() => setEditModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: Colors.card, borderRadius: 20, padding: 24, width: '85%', borderWidth: 1, borderColor: Colors.border }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: 4 }}>{editingContact?.label}</Text>
            <Text style={{ fontSize: 13, color: Colors.textMuted, marginBottom: 16 }}>Enter the correct phone number</Text>
            <TextInput
              style={{ backgroundColor: Colors.bg, borderRadius: 12, padding: 14, color: Colors.text, fontSize: 15, marginBottom: 16, borderWidth: 1, borderColor: Colors.border }}
              value={editNumber}
              onChangeText={setEditNumber}
              keyboardType="phone-pad"
              placeholder="Phone number"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={{ flex: 1, minHeight: 48, justifyContent: 'center', backgroundColor: Colors.bg, borderRadius: 12, alignItems: 'center' }} onPress={() => setEditModal(false)}>
                <Text style={{ color: Colors.text, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, minHeight: 48, justifyContent: 'center', backgroundColor: Colors.accent, borderRadius: 12, alignItems: 'center' }} onPress={handleSaveContact}>
                <Text style={{ color: '#fff', fontWeight: '800' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};