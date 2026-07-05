import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useColors } from '../theme/ThemeProvider';
import { Listing } from '../api/listings';

const CARD_WIDTH = (Dimensions.get('window').width - 48) / 2;

interface Props {
  listing: Listing;
  onPress: (listing: Listing) => void;
  onInterested: (listing: Listing) => void;
}

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const softShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 4,
};

export const ListingCard: React.FC<Props> = ({ listing, onPress, onInterested }) => {
  const Colors = useColors();

  const conditionColor = (condition: string) => {
    if (condition === 'New') return Colors.success;
    if (condition === 'Like New') return Colors.accent;
    return Colors.textMuted;
  };

  const styles = StyleSheet.create({
    card: {
      width: CARD_WIDTH,
      backgroundColor: Colors.card,
      borderRadius: 18,
      overflow: 'hidden',
      marginBottom: 12,
      ...softShadow,
    },
    image: { width: '100%', height: 118, backgroundColor: Colors.cardAlt },

    // Price badge — stays dark overlay, slightly smaller
    priceBadge: {
      position: 'absolute', top: 8, right: 8,
      backgroundColor: 'rgba(0,0,0,0.65)',
      borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3,
    },
    priceText: { color: '#fff', fontWeight: '800', fontSize: 12 },

    // Condition badge — colored dot + text, no border box
    conditionWrap: {
      position: 'absolute', top: 8, left: 8,
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: 'rgba(0,0,0,0.55)',
      borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3,
    },
    conditionDot: { width: 5, height: 5, borderRadius: 3 },
    conditionText: { fontSize: 10, fontWeight: '700', color: '#fff' },

    content: { padding: 9 },
    title: { color: Colors.text, fontWeight: '700', fontSize: 12.5, lineHeight: 17, marginBottom: 7 },
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    time: { color: Colors.textDim, fontSize: 10.5 },

    // Interested button — accent, rounded, compact
    interestedBtn: {
      backgroundColor: Colors.accent,
      borderRadius: 10,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },
    interestedText: { color: '#fff', fontWeight: '700', fontSize: 11 },
    interestCount: { color: Colors.textMuted, fontSize: 10.5, marginTop: 5 },
  });

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(listing)} activeOpacity={0.85}>
      <Image source={{ uri: listing.images?.[0] }} style={styles.image} resizeMode="cover" />
      <View style={styles.priceBadge}>
        <Text style={styles.priceText}>₹{listing.price}</Text>
      </View>
      <View style={styles.conditionWrap}>
        <View style={[styles.conditionDot, { backgroundColor: conditionColor(listing.condition) }]} />
        <Text style={styles.conditionText}>{listing.condition}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{listing.title}</Text>
        <View style={styles.footer}>
          <Text style={styles.time}>🕐 {timeAgo(listing.createdAt)}</Text>
          <TouchableOpacity style={styles.interestedBtn} onPress={() => onInterested(listing)} activeOpacity={0.8}>
            <Text style={styles.interestedText}>👋 Chat</Text>
          </TouchableOpacity>
        </View>
        {listing.interestCount > 0 && (
          <Text style={styles.interestCount}>🔥 {listing.interestCount} interested</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};