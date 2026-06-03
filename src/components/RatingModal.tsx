import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal,
  StyleSheet, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../theme/colors';

const API_URL = 'https://campus-backend-production-2dbb.up.railway.app';

interface Props {
  visible: boolean;
  onClose: () => void;
  toUserId: string;
  listingId: string;
  listingTitle: string;
  sellerHandle: string;
}

export const RatingModal = ({ visible, onClose, toUserId, listingId, listingTitle, sellerHandle }: Props) => {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (score === 0) {
      Alert.alert('Select a rating', 'Please select at least 1 star.');
      return;
    }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/users/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ toUserId, listingId, score, comment }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      Alert.alert('✅ Rating submitted!', 'Thank you for your feedback.');
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit rating.');
    } finally {
      setLoading(false);
    }
  };

  const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Rate this seller</Text>
          <Text style={styles.sub}>Re: {listingTitle}</Text>
          <Text style={styles.handle}>{sellerHandle}</Text>

          {/* Stars */}
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map(i => (
              <TouchableOpacity key={i} onPress={() => setScore(i)}>
                <Text style={[styles.star, i <= score && styles.starActive]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
          {score > 0 && (
            <Text style={styles.scoreLabel}>{labels[score]}</Text>
          )}

          {/* Comment */}
          <TextInput
            style={styles.input}
            value={comment}
            onChangeText={setComment}
            placeholder="Add a comment (optional)"
            placeholderTextColor={Colors.textDim}
            multiline
            maxLength={200}
          />

          {/* Buttons */}
          <View style={styles.btns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, loading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitText}>Submit Rating</Text>
              }
            </TouchableOpacity>
          </View>
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
  title: { fontSize: 20, fontWeight: '900', color: Colors.text, marginBottom: 4 },
  sub: { fontSize: 13, color: Colors.textMuted, marginBottom: 2 },
  handle: { fontSize: 14, fontWeight: '700', color: Colors.accent, marginBottom: 20 },
  stars: { flexDirection: 'row', gap: 8, marginBottom: 8, justifyContent: 'center' },
  star: { fontSize: 40, color: Colors.border },
  starActive: { color: '#FFB347' },
  scoreLabel: {
    textAlign: 'center', fontSize: 14, fontWeight: '700',
    color: Colors.text, marginBottom: 16,
  },
  input: {
    backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1,
    borderColor: Colors.border, padding: 14, color: Colors.text,
    fontSize: 14, minHeight: 80, textAlignVertical: 'top',
    marginBottom: 20,
  },
  btns: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  cancelText: { color: Colors.text, fontWeight: '700' },
  submitBtn: {
    flex: 2, backgroundColor: Colors.accent,
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: '800' },
});