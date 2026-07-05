import React, { useState } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, ActivityIndicator, SafeAreaView,
  Modal, TextInput, Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '../../theme/ThemeProvider';
import { requestChat, Listing } from '../../api/listings';
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = 'https://campus-backend-production-2dbb.up.railway.app';
const { width } = Dimensions.get('window');

type RootStackParamList = {
  ListingDetail: { listing: Listing };
  ChatRoom: { chatId: string; listingTitle: string };
};

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'];
const CATEGORIES = ['Books', 'Electronics', 'Clothes', 'Food', 'Others'];

const softShadow = {
  shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
};
const cardShadow = {
  shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.18, shadowRadius: 10, elevation: 5,
};

export const ListingDetailScreen = () => {
  const Colors = useColors();
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
  const conditionColor = listing.condition === 'New' ? Colors.success : listing.condition === 'Like New' ? Colors.accent : Colors.textMuted;

  // Edit modal styles
  const em = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32, maxHeight: '90%', ...cardShadow },
    handle: { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
    title: { fontSize: 17, fontWeight: '900', color: Colors.text, marginBottom: 14 },
    label: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6, marginTop: 12 },
    input: { backgroundColor: Colors.bg, borderRadius: 12, padding: 12, color: Colors.text, fontSize: 14, ...softShadow },
    textArea: { minHeight: 80 },
    pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pill: { backgroundColor: Colors.bg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
    pillActive: { backgroundColor: Colors.accent },
    pillText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
    pillTextActive: { color: '#fff' },
    btnRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
    cancelBtn: { flex: 1, backgroundColor: Colors.bg, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
    cancelText: { color: Colors.text, fontWeight: '700' },
    saveBtn: { flex: 2, backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 14, alignItems: 'center', ...softShadow },
    saveText: { color: '#fff', fontWeight: '800' },
  });

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },

    // Image carousel
    imageWrap: { position: 'relative' },
    image: { width, height: 270 },
    backBtn: { position: 'absolute', top: 14, left: 14, backgroundColor: 'rgba(11,15,26,0.75)', borderRadius: 12, width: 36, height: 36, alignItems: 'center', justifyContent: 'center', ...softShadow },
    backBtnText: { color: '#fff', fontSize: 18 },
    deleteBtn: { position: 'absolute', top: 14, right: 14, backgroundColor: Colors.danger, borderRadius: 12, width: 36, height: 36, alignItems: 'center', justifyContent: 'center', ...softShadow },
    deleteBtnText: { fontSize: 16 },
    soldOverlay: { position: 'absolute', top: '50%', left: 0, right: 0, alignItems: 'center', transform: [{ translateY: -20 }, { rotate: '-15deg' }] },
    soldOverlayText: { fontSize: 40, fontWeight: '900', color: '#fff', backgroundColor: Colors.danger, paddingHorizontal: 30, paddingVertical: 8, borderRadius: 8, letterSpacing: 4, opacity: 0.9 },
    dots: { flexDirection: 'row', justifyContent: 'center', position: 'absolute', bottom: 10, width: '100%', gap: 5 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
    dotActive: { backgroundColor: '#fff', width: 16 },

    body: { padding: 16 },

    // Badges row — no border boxes, colored dot + text
    badges: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 10 },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.card, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4, ...softShadow },
    badgeDot: { width: 5, height: 5, borderRadius: 3 },
    badgeText: { fontSize: 11, fontWeight: '700' },

    listingTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, lineHeight: 26 },
    price: { fontSize: 28, fontWeight: '900', color: Colors.accent, marginTop: 4 },

    // Owner action buttons — shadow, no border
    ownerActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
    ownerBtn: { flex: 1, backgroundColor: Colors.card, borderRadius: 14, paddingVertical: 12, alignItems: 'center', ...softShadow },
    ownerBtnText: { fontWeight: '700', fontSize: 13, color: Colors.text },
    soldBtn: { backgroundColor: Colors.success + '18' },

    // Description section — shadow, no border
    section: { backgroundColor: Colors.cardAlt, borderRadius: 18, padding: 16, marginTop: 14, ...softShadow },
    sectionLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
    description: { fontSize: 14, color: Colors.text, lineHeight: 22 },

    // Seller card — shadow, no border, gradient avatar
    sellerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.cardAlt, borderRadius: 18, padding: 14, marginTop: 12, ...softShadow },
    sellerAvatar: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    sellerInfo: { flex: 1 },
    sellerName: { fontWeight: '700', color: Colors.text, fontSize: 13.5 },
    sellerSub: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
    verifiedBadge: { backgroundColor: Colors.success + '20', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    verifiedText: { fontSize: 10, fontWeight: '700', color: Colors.success },

    interests: { color: Colors.textMuted, fontSize: 13, marginTop: 12 },

    // CTA bar — shadow instead of top border
    ctaWrap: { paddingHorizontal: 16, paddingBottom: 20, paddingTop: 12, backgroundColor: Colors.bg, ...softShadow },
    ctaBtn: { borderRadius: 14, overflow: 'hidden' },
    ctaBtnGradient: { paddingVertical: 15, alignItems: 'center' },
    ctaBtnDisabled: { backgroundColor: Colors.accentDim, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
    ctaText: { color: '#fff', fontWeight: '800', fontSize: 15 },
    ctaNote: { textAlign: 'center', color: Colors.textDim, fontSize: 11, marginTop: 8 },
  });

  const handleInterested = async () => {
    setLoading(true);
    try {
      const { chatId } = await requestChat(listing.id);
      navigation.navigate('ChatRoom', { chatId, listingTitle: listing.title });
    } catch (err) { console.error('Chat request failed:', err); }
    finally { setLoading(false); }
  };

  const handleDelete = () => {
    Alert.alert('Delete Listing', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setDeleting(true);
        try {
          const token = await AsyncStorage.getItem('token');
          const response = await fetch(`${API_URL}/api/listings/${listing.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
          if (response.ok) navigation.goBack();
          else Alert.alert('Error', 'Failed to delete listing.');
        } catch (e) { Alert.alert('Error', 'Check your connection.'); }
        finally { setDeleting(false); }
      }},
    ]);
  };

  const handleMarkSold = () => {
    Alert.alert('Mark as Sold', 'Mark this listing as sold?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark Sold', onPress: async () => {
        setMarkingSold(true);
        try {
          const token = await AsyncStorage.getItem('token');
          const response = await fetch(`${API_URL}/api/listings/${listing.id}/sold`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
          if (response.ok) { const updated = await response.json(); setListing((prev: any) => ({ ...prev, status: updated.status })); }
          else Alert.alert('Error', 'Failed to mark as sold.');
        } catch (e) { Alert.alert('Error', 'Check your connection.'); }
        finally { setMarkingSold(false); }
      }},
    ]);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editPrice.trim()) { Alert.alert('Missing fields', 'Title and price are required.'); return; }
    setSavingEdit(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/listings/${listing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: editTitle.trim(), description: editDescription.trim(), price: Number(editPrice), condition: editCondition, category: editCategory }),
      });
      if (response.ok) { const updated = await response.json(); setListing((prev: any) => ({ ...prev, ...updated })); setEditVisible(false); }
      else Alert.alert('Error', 'Failed to update listing.');
    } catch (e) { Alert.alert('Error', 'Check your connection.'); }
    finally { setSavingEdit(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Image carousel */}
        <View style={styles.imageWrap}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={e => setActiveImage(Math.round(e.nativeEvent.contentOffset.x / width))}>
            {listing.images.map((uri: string, i: number) => (
              <Image key={i} source={{ uri }} style={styles.image} resizeMode="cover" />
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          {isOwner && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={deleting}>
              {deleting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.deleteBtnText}>🗑️</Text>}
            </TouchableOpacity>
          )}
          {isSold && <View style={styles.soldOverlay}><Text style={styles.soldOverlayText}>SOLD</Text></View>}
          {listing.images.length > 1 && (
            <View style={styles.dots}>
              {listing.images.map((_: string, i: number) => <View key={i} style={[styles.dot, i === activeImage && styles.dotActive]} />)}
            </View>
          )}
        </View>

        <View style={styles.body}>
          {/* Badges — colored dot chips, shadow */}
          <View style={styles.badges}>
            <View style={styles.badge}>
              <View style={[styles.badgeDot, { backgroundColor: conditionColor }]} />
              <Text style={[styles.badgeText, { color: conditionColor }]}>{listing.condition}</Text>
            </View>
            <View style={styles.badge}>
              <View style={[styles.badgeDot, { backgroundColor: Colors.success }]} />
              <Text style={[styles.badgeText, { color: Colors.success }]}>Verified College</Text>
            </View>
            <View style={styles.badge}>
              <Text style={[styles.badgeText, { color: Colors.textMuted }]}>{listing.category}</Text>
            </View>
            {isSold && (
              <View style={[styles.badge, { backgroundColor: Colors.danger + '18' }]}>
                <Text style={[styles.badgeText, { color: Colors.danger }]}>SOLD</Text>
              </View>
            )}
          </View>

          <Text style={styles.listingTitle}>{listing.title}</Text>
          <Text style={styles.price}>₹{listing.price}</Text>

          {isOwner && (
            <View style={styles.ownerActions}>
              <TouchableOpacity style={styles.ownerBtn} onPress={() => setEditVisible(true)}>
                <Text style={styles.ownerBtnText}>✏️ Edit</Text>
              </TouchableOpacity>
              {!isSold && (
                <TouchableOpacity style={[styles.ownerBtn, styles.soldBtn]} onPress={handleMarkSold} disabled={markingSold}>
                  {markingSold ? <ActivityIndicator color={Colors.success} size="small" /> : <Text style={[styles.ownerBtnText, { color: Colors.success }]}>✓ Mark as Sold</Text>}
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>

          {/* Seller card — gradient avatar */}
          <View style={styles.sellerCard}>
            <LinearGradient colors={[Colors.accent, Colors.accentAlt]} style={styles.sellerAvatar}>
              <Text style={{ fontSize: 18 }}>🎭</Text>
            </LinearGradient>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>Anonymous Seller</Text>
              <Text style={styles.sellerSub}>Identity revealed after chat accepted</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ Verified</Text>
            </View>
          </View>

          <Text style={styles.interests}>
            🔥 <Text style={{ color: Colors.text, fontWeight: '700' }}>{listing.interestCount}</Text> students interested
          </Text>
        </View>
      </ScrollView>

      {/* CTA — gradient button */}
      {!isOwner && (
        <View style={styles.ctaWrap}>
          {isSold ? (
            <View style={styles.ctaBtnDisabled}>
              <Text style={styles.ctaText}>This item is sold</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.ctaBtn} onPress={handleInterested} disabled={loading} activeOpacity={0.85}>
              <LinearGradient colors={[Colors.accent, Colors.accentAlt]} style={styles.ctaBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>👋 I'm Interested — Open Chat</Text>}
              </LinearGradient>
            </TouchableOpacity>
          )}
          {!isSold && <Text style={styles.ctaNote}>A private chat request will be sent to the seller</Text>}
        </View>
      )}

      {/* Edit modal */}
      <Modal visible={editVisible} animationType="slide" transparent onRequestClose={() => setEditVisible(false)}>
        <View style={em.overlay}>
          <ScrollView>
            <View style={em.sheet}>
              <View style={em.handle} />
              <Text style={em.title}>Edit Listing</Text>
              <Text style={em.label}>Title</Text>
              <TextInput style={em.input} value={editTitle} onChangeText={setEditTitle} placeholderTextColor={Colors.textDim} />
              <Text style={em.label}>Description</Text>
              <TextInput style={[em.input, em.textArea]} value={editDescription} onChangeText={setEditDescription} multiline numberOfLines={4} textAlignVertical="top" placeholderTextColor={Colors.textDim} />
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
                  {savingEdit ? <ActivityIndicator color="#fff" size="small" /> : <Text style={em.saveText}>Save Changes</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};