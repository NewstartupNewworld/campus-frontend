import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../theme/colors';

const API_URL = 'https://campus-backend-production-2dbb.up.railway.app';

const REASONS = [
  'Spam or misleading',
  'Inappropriate content',
  'Fake listing',
  'Harassment',
  'Scam or fraud',
  'Wrong category',
  'Other',
];

interface Props {
  visible: boolean;
  onClose: () => void;
  targetType: 'listing' | 'user' | 'buzz_post' | 'message';
  targetId: string;
  targetName: string;
}

export const ReportModal = ({ visible, onClose, targetType, targetId, targetName }: Props) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Select a reason', 'Please select a reason for reporting.');
      return;
    }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetType,
          targetId,
          reason: selectedReason,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      Alert.alert('✅ Report submitted', 'Thank you. Our team will review this shortly.');
      setSelectedReason('');
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Report</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sub}>Reporting: {targetName}</Text>

          <Text style={styles.label}>Why are you reporting this?</Text>
          {REASONS.map(reason => (
            <TouchableOpacity
              key={reason}
              style={[styles.reasonRow, selectedReason === reason && styles.reasonRowActive]}
              onPress={() => setSelectedReason(reason)}
            >
              <Text style={[styles.reasonText, selectedReason === reason && styles.reasonTextActive]}>
                {reason}
              </Text>
              <View style={[styles.radio, selectedReason === reason && styles.radioActive]}>
                {selectedReason === reason && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitText}>Submit Report</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: Colors.bg, borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 24, paddingBottom: 40,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  title: { fontSize: 20, fontWeight: '900', color: Colors.text },
  close: { fontSize: 18, color: Colors.textMuted },
  sub: { fontSize: 13, color: Colors.textMuted, marginBottom: 20 },
  label: {
    fontSize: 11, fontWeight: '700', color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12,
  },
  reasonRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 14,
    backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1,
    borderColor: Colors.border, marginBottom: 8,
  },
  reasonRowActive: { borderColor: Colors.danger, backgroundColor: Colors.danger + '0F' },
  reasonText: { fontSize: 14, color: Colors.text },
  reasonTextActive: { color: Colors.danger, fontWeight: '700' },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: Colors.danger },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.danger },
  submitBtn: {
    backgroundColor: Colors.danger, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center', marginTop: 16,
  },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});