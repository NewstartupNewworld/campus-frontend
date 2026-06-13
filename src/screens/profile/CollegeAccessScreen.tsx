import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, FlatList, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../theme/colors';

const API_URL = 'https://campus-backend-production-2dbb.up.railway.app';

interface AccessRequest {
  id: string;
  target_college: string;
  reason: string | null;
  status: string;
  created_at: string;
  requester_handle?: string;
}

export const CollegeAccessScreen = () => {
  const navigation = useNavigation();
  const [targetCollege, setTargetCollege] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState<AccessRequest[]>([]);
  const [incoming, setIncoming] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const [myRes, inRes] = await Promise.all([
        fetch(`${API_URL}/api/college-access/my-requests`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/college-access/incoming`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const myData = await myRes.json();
      const inData = await inRes.json();
      if (myRes.ok) setMyRequests(myData.requests || []);
      if (inRes.ok) setIncoming(inData.requests || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async () => {
    if (!targetCollege.trim()) {
      Alert.alert('Missing field', 'Please enter the college name you want access to.');
      return;
    }
    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/college-access/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetCollege: targetCollege.trim(), reason: reason.trim() || null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit request');
      Alert.alert('✅ Request sent', `Your request to join ${targetCollege} has been submitted for approval.`);
      setTargetCollege('');
      setReason('');
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/college-access/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update');
      setIncoming(prev => prev.filter(r => r.id !== id));
      Alert.alert(status === 'approved' ? '✅ Approved' : '❌ Rejected', `Request has been ${status}.`);
    } catch (e) {
      Alert.alert('Error', 'Failed to update request.');
    }
  };

  const statusColor = (status: string) =>
    status === 'approved' ? Colors.success : status === 'rejected' ? Colors.danger : Colors.warn;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={Colors.accent} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cross-College Access</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Request form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏫 Request Access</Text>
          <Text style={styles.cardSub}>
            Want to view or join another college's Buzz, Marketplace, or Groups? Send a request — students from that college will review it.
          </Text>

          <Text style={styles.label}>College Name</Text>
          <TextInput
            style={styles.input}
            value={targetCollege}
            onChangeText={setTargetCollege}
            placeholder="e.g. NIT Goa"
            placeholderTextColor={Colors.textDim}
          />

          <Text style={styles.label}>Reason (optional)</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={reason}
            onChangeText={setReason}
            placeholder="Why do you want access?"
            placeholderTextColor={Colors.textDim}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitText}>Send Request</Text>
            }
          </TouchableOpacity>
        </View>

        {/* My requests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Requests</Text>
          {myRequests.length === 0 ? (
            <Text style={styles.empty}>You haven't requested access to any other college yet.</Text>
          ) : (
            myRequests.map(r => (
              <View key={r.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <Text style={styles.requestCollege}>{r.target_college}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor(r.status) + '22', borderColor: statusColor(r.status) + '55' }]}>
                    <Text style={[styles.statusText, { color: statusColor(r.status) }]}>
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </Text>
                  </View>
                </View>
                {r.reason && <Text style={styles.requestReason}>{r.reason}</Text>}
              </View>
            ))
          )}
        </View>

        {/* Incoming requests to review */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requests to Your College</Text>
          {incoming.length === 0 ? (
            <Text style={styles.empty}>No pending requests for your college.</Text>
          ) : (
            incoming.map(r => (
              <View key={r.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <Text style={styles.requestCollege}>{r.requester_handle}</Text>
                  <Text style={styles.requestFrom}>from your college</Text>
                </View>
                {r.reason && <Text style={styles.requestReason}>{r.reason}</Text>}
                <View style={styles.reviewBtns}>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => handleReview(r.id, 'approved')}>
                    <Text style={styles.approveText}>✓ Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReview(r.id, 'rejected')}>
                    <Text style={styles.rejectText}>✕ Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  backText: { color: Colors.text, fontSize: 22 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  scroll: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, marginBottom: 20 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 6 },
  cardSub: { fontSize: 12, color: Colors.textMuted, lineHeight: 18, marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8, marginTop: 4 },
  input: { backgroundColor: Colors.bg, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 12, color: Colors.text, fontSize: 14, marginBottom: 14 },
  multiline: { height: 80 },
  submitBtn: { backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  empty: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingVertical: 20 },
  requestCard: { backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 14, marginBottom: 10 },
  requestHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  requestCollege: { fontSize: 14, fontWeight: '700', color: Colors.text },
  requestFrom: { fontSize: 11, color: Colors.textMuted },
  statusBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  requestReason: { fontSize: 12, color: Colors.textMuted, lineHeight: 18, marginBottom: 8 },
  reviewBtns: { flexDirection: 'row', gap: 10, marginTop: 6 },
  approveBtn: { flex: 1, backgroundColor: Colors.success + '18', borderWidth: 1, borderColor: Colors.success + '44', borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  approveText: { color: Colors.success, fontWeight: '700', fontSize: 13 },
  rejectBtn: { flex: 1, backgroundColor: Colors.danger + '18', borderWidth: 1, borderColor: Colors.danger + '44', borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  rejectText: { color: Colors.danger, fontWeight: '700', fontSize: 13 },
});