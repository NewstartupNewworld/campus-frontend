import React, { useState } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../theme/colors';
import { requestChat, Listing } from '../../api/listings';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  ListingDetail: { listing: Listing };
  ChatRoom: { chatId: string; listingTitle: string };
};

export const ListingDetailScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ListingDetail'>>();
  const { listing } = route.params;

  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(false);

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
            {listing.images.map((uri, i) => (
              <Image key={i} source={{ uri }} style={styles.image} resizeMode="cover" />
            ))}
          </ScrollView>

          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>

          {/* Dots */}
          {listing.images.length > 1 && (
            <View style={styles.dots}>
              {listing.images.map((_, i) => (
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
          </View>

          {/* Title + Price */}
          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.price}>₹{listing.price}</Text>

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
      <View style={styles.ctaWrap}>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={handleInterested}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.ctaText}>👋 I'm Interested — Open Chat</Text>
          }
        </TouchableOpacity>
        <Text style={styles.ctaNote}>A private chat request will be sent to the seller</Text>
      </View>
    </SafeAreaView>
  );
};

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
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  ctaNote: { textAlign: 'center', color: Colors.textDim, fontSize: 11, marginTop: 8 },
});
