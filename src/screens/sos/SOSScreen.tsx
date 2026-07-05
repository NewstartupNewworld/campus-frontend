import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Linking, Alert, Animated, Vibration,
  TextInput, Modal, ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '../../theme/ThemeProvider';

const API_URL = 'https://campus-backend-production-2dbb.up.railway.app';

type AlertSeverity = 'critical' | 'warning' | 'info';

interface SOSAlert {
  id: string; type: string; message: string; location: string;
  reportedBy: string; severity: AlertSeverity; createdAt: string;
  resolved: boolean; respondersCount: number;
}

interface QuickContact {
  label: string; number: string; icon: string; color: string;
}

const softShadow = {
  shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
};
const cardShadow = {
  shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.18, shadowRadius: 10, elevation: 5,
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
};

// --- Pulsing SOS button — unchanged logic, useColors instead of Colors import ---
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
    const a1 = makeLoop(pulse1, 0); const a2 = makeLoop(pulse2, 400); const a3 = makeLoop(pulse3, 800);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [active]);

  const btnStyles = StyleSheet.create({
    wrap: { alignItems: 'center', justifyContent: 'center', height: 220, marginVertical: 8 },
    ring: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: Colors.danger },
    button: { width: 160, height: 160, borderRadius: 80, backgroundColor: Colors.card, borderWidth: 3, borderColor: Colors.danger, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.danger, shadowOpacity: 0.5, shadowRadius: 20, elevation: 12 },
    buttonActive: { backgroundColor: Colors.danger },
    icon: { fontSize: 36, marginBottom: 4 },
    label: { fontSize: 20, fontWeight: '900', color: Colors.text, letterSpacing: 2 },
    sublabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 3 },
  });

  return (
    <View style={btnStyles.wrap}>
      {active && (
        <>
          <Animated.View style={[btnStyles.ring, { transform: [{ scale: pulse1 }], opacity: pulse1.interpolate({ inputRange: [1, 2.2], outputRange: [0.4, 0] }) }]} />
          <Animated.View style={[btnStyles.ring, { transform: [{ scale: pulse2 }], opacity: pulse2.interpolate({ inputRange: [1, 2.2], outputRange: [0.3, 0] }) }]} />
          <Animated.View style={[btnStyles.ring, { transform: [{ scale: pulse3 }], opacity: pulse3.interpolate({ inputRange: [1, 2.2], outputRange: [0.2, 0] }) }]} />
        </>
      )}
      <TouchableOpacity style={[btnStyles.button, active && btnStyles.buttonActive]} onPress={onPress} activeOpacity={0.85}>
        <Text style={btnStyles.icon}>{active ? '✕' : '🚨'}</Text>
        <Text style={btnStyles.label}>{active ? 'CANCEL' : 'SOS'}</Text>
        <Text style={btnStyles.sublabel}>{active ? 'Alert is live' : 'Tap to send alert'}</Text>
      </TouchableOpacity>
    </View>
  );
};

// --- Alert type picker — shadow pills, no borders ---
const AlertTypePicker = ({ selected, onSelect }: { selected: string; onSelect: (t: string) => void }) => {
  const Colors = useColors();
  const ALERT_TYPES = ['Medical Emergency', 'Fire', 'Suspicious Activity', 'Harassment', 'Power Outage', 'Flood / Waterlogging', 'Other'];
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>Alert Type</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {ALERT_TYPES.map(t => (
          <TouchableOpacity
            key={t}
            style={[{ backgroundColor: Colors.card, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, ...softShadow },
              selected === t && { backgroundColor: Colors.danger + '22' }]}
            onPress={() => onSelect(t)}
          >
            <Text style={[{ fontSize: 12, fontWeight: '600', color: Colors.textMuted }, selected === t && { color: Colors.danger, fontWeight: '700' }]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// --- Contact card — shadow, colored accent, no border ---
const ContactCard = ({ contact, onLongPress }: { contact: QuickContact; onLongPress: () => void }) => {
  const Colors = useColors();
  return (
    <TouchableOpacity
      style={{ width: '47%', backgroundColor: Colors.card, borderRadius: 16, padding: 14, alignItems: 'center', gap: 4, ...softShadow }}
      onPress={() => Linking.openURL(`tel:${contact.number}`)}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: contact.color + '18', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 22 }}>{contact.icon}</Text>
      </View>
      <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.text, textAlign: 'center' }}>{contact.label}</Text>
      <Text style={{ fontSize: 12, fontWeight: '800', color: contact.color }}>{contact.number}</Text>
      <Text style={{ fontSize: 9, color: Colors.textDim, marginTop: 1 }}>Hold to edit</Text>
    </TouchableOpacity>
  );
};

// --- Alert card — shadow, no border, severity tint ---
const AlertCard = ({ alert, onRespond }: { alert: SOSAlert; onRespond: (id: string) => void }) => {
  const Colors = useColors();
  const severityColor = (s: AlertSeverity) => s === 'critical' ? Colors.danger : s === 'warning' ? Colors.warn : Colors.accent;
  const severityIcon = (s: AlertSeverity) => s === 'critical' ? '🚨' : s === 'warning' ? '⚠️' : 'ℹ️';
  const color = severityColor(alert.severity);
  return (
    <View style={{ backgroundColor: Colors.card, borderRadius: 16, marginBottom: 10, padding: 14, opacity: alert.resolved ? 0.5 : 1, ...softShadow }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
        <Text style={{ fontSize: 18 }}>{severityIcon(alert.severity)}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '800', fontSize: 13.5, color }}>{alert.type}</Text>
          <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 2 }}>📍 {alert.location} · {timeAgo(alert.createdAt)}</Text>
        </View>
        {alert.resolved ? (
          <View style={{ backgroundColor: Colors.success + '22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: Colors.success }}>✓ Resolved</Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: color + '22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
            <Text style={{ fontSize: 10, fontWeight: '700', color }}>Live</Text>
          </View>
        )}
      </View>
      <Text style={{ fontSize: 13, color: Colors.text, lineHeight: 19, marginBottom: 10 }}>{alert.message}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 11, color: Colors.textDim }}>Reported by {alert.reportedBy}</Text>
        {!alert.resolved && (
          <TouchableOpacity
            style={{ backgroundColor: color + '18', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 }}
            onPress={() => onRespond(alert.id)}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color }}>🙋 Responding ({alert.respondersCount})</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export const SOSScreen = () => {
  const Colors = useColors();
  const [sosActive, setSosActive] = useState(false);
  const [alertType, setAlertType] = useState('Medical Emergency');
  const [location, setLocation] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [countingDown, setCountingDown] = useState(false);
  const [contacts, setContacts] = useState<QuickContact[]>([
    { label: 'Campus Security', number: '1800-XXX-0001', icon: '🛡️', color: '#4F7CFF' },
    { label: 'Ambulance',       number: '108',           icon: '🚑', color: '#EF4444' },
    { label: 'Police',          number: '100',           icon: '👮', color: '#4F8CFF' },
    { label: 'Warden',          number: '1800-XXX-0002', icon: '🏠', color: '#F97316' },
    { label: 'Fire',            number: '101',           icon: '🔥', color: '#FF6B35' },
    { label: 'Women Helpline',  number: '1091',          icon: '💜', color: '#C97BFF' },
  ]);
  const [editingContact, setEditingContact] = useState<QuickContact | null>(null);
  const [editNumber, setEditNumber] = useState('');
  const [editModal, setEditModal] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      const geo = await Location.reverseGeocodeAsync(loc.coords);
      if (geo.length > 0) {
        const g = geo[0];
        setLocation([g.name, g.street, g.district].filter(Boolean).join(', '));
      }
    })();
    const loadContacts = async () => {
      try { const saved = await AsyncStorage.getItem('quickContacts'); if (saved) setContacts(JSON.parse(saved)); } catch (e) {}
    };
    loadContacts();
    fetchAlerts();
  }, []);

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
    } catch (e) { console.error('Failed to fetch alerts:', e); }
    finally { setLoadingAlerts(false); }
  };

  const handleSOSPress = () => {
    if (sosActive) { setSosActive(false); setCountingDown(false); if (countdownRef.current) clearInterval(countdownRef.current); setCountdown(5); Vibration.cancel(); return; }
    setCountingDown(true); setCountdown(5);
    Vibration.vibrate([0, 200, 100, 200]);
    let remaining = 5;
    countdownRef.current = setInterval(() => {
      remaining -= 1; setCountdown(remaining);
      if (remaining <= 0) { clearInterval(countdownRef.current!); setCountingDown(false); setSosActive(true); sendSOS(); }
    }, 1000);
  };

  const sendSOS = async () => {
    Vibration.vibrate([0, 500, 200, 500, 200, 500]);
    let backendSucceeded = false;
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: alertType, message: `Emergency reported near ${location ?? 'campus'}. Immediate help needed.`, latitude: coords?.latitude || null, longitude: coords?.longitude || null, locationLabel: location ?? 'Campus' }),
      });
      const data = await response.json();
      if (response.ok) {
        backendSucceeded = true;
        setAlerts(prev => [{ id: data.id, type: alertType, message: `Emergency reported near ${location ?? 'campus'}. Immediate help needed.`, location: location ?? 'Campus', reportedBy: 'You (Anonymous)', severity: alertType === 'Medical Emergency' || alertType === 'Fire' ? 'critical' : 'warning', createdAt: new Date().toISOString(), resolved: false, respondersCount: 0 }, ...prev]);
      }
    } catch (e) { console.error('SOS send error:', e); }
    if (!backendSucceeded) await sendSMSFallback();
  };

  const sendSMSFallback = async () => {
    try {
      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) { Alert.alert('SOS Failed', 'Could not send alert online and SMS is not available on this device.'); return; }
      const mapsLink = coords ? `https://maps.google.com/?q=${coords.latitude},${coords.longitude}` : '';
      const message = `🚨 SOS: ${alertType}\nLocation: ${location ?? 'Unknown'}\n${mapsLink}\nThis is an automated emergency alert from CampusConnect.`;
      const recipients = contacts.filter(c => /^\d{3,}$/.test(c.number.replace(/[-\s]/g, ''))).map(c => c.number.replace(/[-\s]/g, ''));
      await SMS.sendSMSAsync(recipients, message);
    } catch (e) { console.error('SMS fallback error:', e); }
  };

  const handleCancelCountdown = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountingDown(false); setCountdown(5); Vibration.cancel();
  };

  const handleRespond = async (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, respondersCount: a.respondersCount + 1 } : a));
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(`${API_URL}/api/sos/${id}/respond`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    } catch (e) { console.error('Respond error:', e); }
  };

  const handleEditContact = (contact: QuickContact) => { setEditingContact(contact); setEditNumber(contact.number); setEditModal(true); };

  const handleSaveContact = async () => {
    if (!editingContact) return;
    const updated = contacts.map(c => c.label === editingContact.label ? { ...c, number: editNumber } : c);
    setContacts(updated);
    await AsyncStorage.setItem('quickContacts', JSON.stringify(updated));
    setEditModal(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>

        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 }}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: Colors.text }}>🚨 SOS</Text>
          <Text style={{ fontSize: 11.5, color: Colors.textMuted, marginTop: 1 }}>Campus Emergency Network</Text>
        </View>

        {/* Location bar — shadow, no border */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 10, backgroundColor: Colors.card, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, ...softShadow }}>
          <Text style={{ fontSize: 13 }}>📍</Text>
          <Text style={{ flex: 1, fontSize: 12, color: Colors.textMuted }} numberOfLines={1}>{location ?? 'Getting your location...'}</Text>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: location ? Colors.success : Colors.warn }} />
        </View>

        {/* Countdown card */}
        {countingDown && (
          <View style={{ marginHorizontal: 16, marginVertical: 20, backgroundColor: Colors.danger + '18', borderRadius: 20, alignItems: 'center', padding: 30, ...cardShadow }}>
            <Text style={{ fontSize: 80, fontWeight: '900', color: Colors.danger, lineHeight: 90 }}>{countdown}</Text>
            <Text style={{ fontSize: 16, color: Colors.text, fontWeight: '700', marginBottom: 20 }}>Sending SOS in {countdown}s</Text>
            <TouchableOpacity style={{ backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10, ...softShadow }} onPress={handleCancelCountdown}>
              <Text style={{ color: Colors.text, fontWeight: '700', fontSize: 14 }}>✕ Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {!countingDown && (
          <>
            <PulsingSOSButton onPress={handleSOSPress} active={sosActive} />
            {sosActive && (
              <View style={{ marginHorizontal: 16, marginBottom: 14, backgroundColor: Colors.danger + '18', borderRadius: 14, padding: 12, ...softShadow }}>
                <Text style={{ color: Colors.danger, fontSize: 13, fontWeight: '600', textAlign: 'center', lineHeight: 20 }}>🔴 Your SOS is live — nearby students & security have been notified</Text>
              </View>
            )}
            {!sosActive && (
              <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
                <AlertTypePicker selected={alertType} onSelect={setAlertType} />
              </View>
            )}
          </>
        )}

        {/* SMS fallback — shadow, no border */}
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <TouchableOpacity style={{ backgroundColor: Colors.warn + '18', borderRadius: 14, paddingVertical: 13, alignItems: 'center', ...softShadow }} onPress={sendSMSFallback}>
            <Text style={{ color: Colors.warn, fontWeight: '700', fontSize: 13, textAlign: 'center', paddingHorizontal: 10 }}>📩 Send SOS via SMS (works without internet)</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Contacts */}
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <Text style={{ fontSize: 14.5, fontWeight: '800', color: Colors.text, marginBottom: 4 }}>Quick Contacts</Text>
          <Text style={{ fontSize: 11, color: Colors.textDim, marginBottom: 12 }}>💡 Long press any contact to edit the number</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' }}>
            {contacts.map(c => <ContactCard key={c.label} contact={c} onLongPress={() => handleEditContact(c)} />)}
          </View>
        </View>

        {/* Campus Alerts */}
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 14.5, fontWeight: '800', color: Colors.text }}>Campus Alerts</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.danger }} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.danger }}>Live</Text>
            </View>
          </View>
          {loadingAlerts ? (
            <ActivityIndicator color={Colors.danger} style={{ marginVertical: 20 }} />
          ) : alerts.length === 0 ? (
            <Text style={{ textAlign: 'center', color: Colors.textMuted, paddingVertical: 20, fontSize: 13 }}>No active alerts on campus 🟢</Text>
          ) : (
            alerts.map(a => <AlertCard key={a.id} alert={a} onRespond={handleRespond} />)
          )}
        </View>

      </ScrollView>

      {/* Edit contact modal — shadow, no border */}
      <Modal visible={editModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: Colors.card, borderRadius: 20, padding: 24, width: '80%', ...cardShadow }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: 4 }}>Edit {editingContact?.label}</Text>
            <Text style={{ fontSize: 12.5, color: Colors.textMuted, marginBottom: 16 }}>Enter the correct phone number</Text>
            <TextInput
              style={{ backgroundColor: Colors.bg, borderRadius: 12, padding: 13, color: Colors.text, fontSize: 15, marginBottom: 16, ...softShadow }}
              value={editNumber}
              onChangeText={setEditNumber}
              keyboardType="phone-pad"
              placeholder="Phone number"
              placeholderTextColor={Colors.textDim}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={{ flex: 1, backgroundColor: Colors.bg, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }} onPress={() => setEditModal(false)}>
                <Text style={{ color: Colors.text, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 12, alignItems: 'center', ...softShadow }} onPress={handleSaveContact}>
                <Text style={{ color: '#fff', fontWeight: '800' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};