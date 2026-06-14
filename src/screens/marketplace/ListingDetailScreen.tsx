import React, { useState } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, ActivityIndicator, SafeAreaView,
  Modal, TextInput, Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../theme/colors';
import { requestChat, Listing } from '../../api/listings';

const API_URL = 'https://campus-backend-production-2dbb.up.railway.app';
const { width } = Dimensions.get('window');

type RootStackParamList = {
  ListingDetail: { listing: Listing };
  ChatRoom: { chatId: string; listingTitle: string };
};

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'];
const CATEGORIES = ['Books', 'Electronics', 'Clothes', 'Food', 'Others'];

export const ListingDetailScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ListingDetail'>>();
  const { listing: initialListing } = route.params;

  const [listing, setListing] = useState<any>(initialListing);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [markingSold, setMarkingSold] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editTitle, setEditTitle] = useState(listing.title);
  const [editDescription, setEditDescription] = useState(listing.description);
  const [editPrice, setEditPrice] = useState(String(listing.price));
  const [editCondition, setEditCondition] = useState(listing.condition);
  const [editCategory, setEditCategory] = useState(listing.category);
  const [savingEdit, setSavingEdit] = useState(false);

  const isOwner = listing.isOwner;
  const isSold = listing.status === 'sold';

  const handleInterested = async () => {
    setLoading(true);
    try {
      const { chatId } = await requestChat(listing.id);
      navigation.navigate('ChatRoom', { chatId, listingTitle: listing.title });
    } catch (err) {
      console.error('Chat request failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Listing', 'Are you sure you want to delete this listing? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          setDeleting(true);
          try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/listings/${listing.id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
              navigation.goBack();
            } else {
              Alert.alert('Error', 'Failed to delete listing.');
            }
          } catch (e) {
            Alert.alert('Error', 'Failed to delete listing. Check your connection.');
          } finally {
            setDeleting(false);
          }
        }
      },
    ]);
  };

  const handleMarkSold = () => {
    Alert.alert('Mark as Sold', 'Mark this listing as sold? It will no longer be visible in the marketplace.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Sold', onPress: async () => {
          setMarkingSold(true);
          try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/listings/${listing.id}/sold`, {
              method: 'PATCH',
              headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
              const updated = await response.json();
              setListing((prev: any) => ({ ...prev, status: updated.status }));
            } else {
              Alert.alert('Error', 'Failed to mark as sold.');
            }
          } catch (e) {
            Alert.alert('Error', 'Failed to mark as sold. Check your connection.');
          } finally {
            setMarkingSold(false);
          }
        }
      },
    ]);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editPrice.trim()) {
      Alert.alert('Missing fields', 'Title and price are required.');
      return;
    }
    setSavingEdit(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/listings/${listing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
          price: Number(editPrice),
          condition: editCondition,
          category: editCategory,
        }),
      });
      if (response.ok) {
        const updated = await response.json();
        setListing((prev: any) => ({ ...prev, ...updated }));
        setEditVisible(false);
      } else {
        Alert.alert('Error', 'Failed to update listing.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update listing. Check your connection.');
    } finally {
      setSavingEdit(false);
    }
  };

  const conditionColor =
    listing.condition === 'New' ? Colors.success
    : listing.condition === 'Like New' ? Colors.accent
    : Colors.textMuted;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image carousel */}
        <View style={styles.imageWrap}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={e => {
              setActiveImage(Math.round(e.nativeEvent.contentOffset.x / width));
            }}
          >
            {listing.images.map((uri: string, i: number) => (
              <Image key={i} source={{ uri }} style={styles.image} resizeMode="cover" />
            ))}
          </ScrollView>

          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>

          {/* Delete button — only for owner */}
          {isOwner && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={deleting}>
              {deleting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.deleteBtnText}>🗑️</Text>
              }
            </TouchableOpacity>
          )}

          {/* Sold overlay */}
          {isSold && (
            <View style={styles.soldOverlay}>
              <Text style={styles.soldOverlayText}>SOLD</Text>
            </View>
          )}

          {/* Dots */}
          {listing.images.length > 1 && (
            <View style={styles.dots}>
              {listing.images.map((_: string, i: number) => (
                <View key={i} style={[styles.dot, i === activeImage && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>

        <View style={styles.body}>
          {/* Badges */}
          <View style={styles.badges}>
            <View style={[styles.badge, { borderColor: conditionColor + '55' }]}>
              <Text style={[styles.badgeText, { color: conditionColor }]}>{listing.condition}</Text>
            </View>
            <View style={[styles.badge, { borderColor: Colors.success + '55' }]}>
              <Text style={[styles.badgeText, { color: Colors.success }]}>✓ Verified College</Text>
            </View>
            <View style={[styles.badge, { borderColor: Colors.border }]}>
              <Text style={[styles.badgeText, { color: Colors.textMuted }]}>{listing.category}</Text>
            </View>
            {isSold && (
              <View style={[styles.badge, { borderColor: Colors.danger + '55', backgroundColor: Colors.danger + '15' }]}>
                <Text style={[styles.badgeText, { color: Colors.danger }]}>SOLD</Text>
              </View>
            )}
          </View>

          {/* Title + Price */}
          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.price}>₹{listing.price}</Text>

          {/* Owner actions */}
          {isOwner && (
            <View style={styles.ownerActions}>
              <TouchableOpacity style={styles.ownerBtn} onPress={() => setEditVisible(true)}>
                <Text style={styles.ownerBtnText}>✏️ Edit</Text>
              </TouchableOpacity>
              {!isSold && (
                <TouchableOpacity
                  style={[styles.ownerBtn, styles.soldBtn]}
                  onPress={handleMarkSold}
                  disabled={markingSold}
                >
                  {markingSold
                    ? <ActivityIndicator color={Colors.success} size="small" />
                    : <Text style={[styles.ownerBtnText, { color: Colors.success }]}>✓ Mark as Sold</Text>
                  }
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>

          {/* Anonymous seller — privacy feature */}
          <View style={styles.sellerCard}>
            <View style={styles.sellerAvatar}>
              <Text style={{ fontSize: 20 }}>🎭</Text>
            </View>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>Anonymous Seller</Text>
              <Text style={styles.sellerSub}>Identity revealed after chat accepted</Text>
            </View>
            <View style={[styles.badge, { borderColor: Colors.success + '55' }]}>
              <Text style={[styles.badgeText, { color: Colors.success }]}>✓ Verified</Text>
            </View>
          </View>

          {/* Interest count */}
          <Text style={styles.interests}>
            🔥 <Text style={{ color: Colors.text, fontWeight: '700' }}>{listing.interestCount}</Text> students interested
          </Text>
        </View>
      </ScrollView>

      {/* CTA */}
      {!isOwner && (
        <View style={styles.ctaWrap}>
          <TouchableOpacity
            style={[styles.ctaBtn, isSold && styles.ctaBtnDisabled]}
            onPress={handleInterested}
            disabled={loading || isSold}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.ctaText}>{isSold ? 'This item is sold' : "👋 I'm Interested — Open Chat"}</Text>
            }
          </TouchableOpacity>
          {!isSold && <Text style={styles.ctaNote}>A private chat request will be sent to the seller</Text>}
        </View>
      )}

      {/* Edit Modal */}
      <Modal visible={editVisible} animationType="slide" transparent onRequestClose={() => setEditVisible(false)}>
        <View style={em.overlay}>
          <View style={em.sheet}>
            <View style={em.handle} />
            <Text style={em.title}>Edit Listing</Text>

            <Text style={em.label}>Title</Text>
            <TextInput style={em.input} value={editTitle} onChangeText={setEditTitle} placeholderTextColor={Colors.textDim} />

            <Text style={em.label}>Description</Text>
            <TextInput
              style={[em.input, em.textArea]}
              value={editDescription}
              onChangeText={setEditDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor={Colors.textDim}
            />

            <Text style={em.label}>Price (₹)</Text>
            <TextInput style={em.input} value={editPrice} onChangeText={setEditPrice} keyboardType="numeric" placeholderTextColor={Colors.textDim} />

            <Text style={em.label}>Condition</Text>
            <View style={em.pills}>
              {CONDITIONS.map(c => (
                <TouchableOpacity key={c} style={[em.pill, editCondition === c && em.pillActive]} onPress={() => setEditCondition(c)}>
                  <Text style={[em.pillText, editCondition === c && em.pillTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={em.label}>Category</Text>
            <View style={em.pills}>
              {CATEGORIES.map(c => (
                <TouchableOpacity key={c} style={[em.pill, editCategory === c && em.pillActive]} onPress={() => setEditCategory(c)}>
                  <Text style={[em.pillText, editCategory === c && em.pillTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={em.btnRow}>
              <TouchableOpacity style={em.cancelBtn} onPress={() => setEditVisible(false)}>
                <Text style={em.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={em.saveBtn} onPress={handleSaveEdit} disabled={savingEdit}>
                {savingEdit
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={em.saveText}>Save Changes</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const em = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 30, maxHeight: '90%' },
  handle: { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  title: { fontSize: 18, fontWeight: '900', color: Colors.text, marginBottom: 14 },
  label: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 12, color: Colors.text, fontSize: 14 },
  textArea: { minHeight: 80 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { backgroundColor: Colors.card, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 6 },
  pillActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  pillText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  pillTextActive: { color: '#fff' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  cancelText: { color: Colors.text, fontWeight: '700' },
  saveBtn: { flex: 2, backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '800' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  imageWrap: { position: 'relative' },
  image: { width, height: 280 },
  backBtn: {
    position: 'absolute', top: 14, left: 14,
    backgroundColor: 'rgba(15,17,21,0.8)',
    borderRadius: 10, width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { color: Colors.text, fontSize: 18 },
  deleteBtn: {
    position: 'absolute', top: 14, right: 14,
    backgroundColor: Colors.danger,
    borderRadius: 10, width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  deleteBtnText: { fontSize: 16 },
  soldOverlay: {
    position: 'absolute', top: '50%', left: 0, right: 0,
    alignItems: 'center', transform: [{ translateY: -20 }, { rotate: '-15deg' }],
  },
  soldOverlayText: {
    fontSize: 40, fontWeight: '900', color: '#fff',
    backgroundColor: Colors.danger, paddingHorizontal: 30, paddingVertical: 8,
    borderRadius: 8, letterSpacing: 4, opacity: 0.9,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', position: 'absolute', bottom: 10, width: '100%', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.textDim },
  dotActive: { backgroundColor: Colors.accent, width: 14 },
  body: { padding: 16 },
  badges: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 10 },
  badge: {
    borderWidth: 1, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: 'transparent',
  },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  title: { fontSize: 20, fontWeight: '800', color: Colors.text, lineHeight: 26 },
  price: { fontSize: 26, fontWeight: '900', color: Colors.accent, marginTop: 4 },
  ownerActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  ownerBtn: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    paddingVertical: 12, alignItems: 'center',
  },
  ownerBtnText: { fontWeight: '700', fontSize: 13, color: Colors.text },
  soldBtn: { borderColor: Colors.success + '55', backgroundColor: Colors.success + '15' },
  section: {
    backgroundColor: Colors.cardAlt, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    padding: 14, marginTop: 14,
  },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  description: { fontSize: 14, color: Colors.text, lineHeight: 22 },
  sellerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.cardAlt, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    padding: 14, marginTop: 12,
  },
  sellerAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.card,
    alignItems: 'center', justifyContent: 'center',
  },
  sellerInfo: { flex: 1 },
  sellerName: { fontWeight: '700', color: Colors.text, fontSize: 14 },
  sellerSub: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  interests: { color: Colors.textMuted, fontSize: 13, marginTop: 12 },
  ctaWrap: {
    paddingHorizontal: 16, paddingBottom: 20, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  ctaBtn: {
    backgroundColor: Colors.accent, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center',
  },
  ctaBtnDisabled: { backgroundColor: Colors.accentDim },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  ctaNote: { textAlign: 'center', color: Colors.textDim, fontSize: 11, marginTop: 8 },
});