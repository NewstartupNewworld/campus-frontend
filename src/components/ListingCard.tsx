import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Listing } from '../api/listings';

const CARD_WIDTH = (Dimensions.get('window').width - 48) / 2;

interface Props {
  listing: Listing;
  onPress: (listing: Listing) => void;
  onInterested: (listing: Listing) => void;
}

const conditionColor = (condition: string) => {
  if (condition === 'New') return Colors.success;
  if (condition === 'Like New') return Colors.accent;
  return Colors.textMuted;
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export const ListingCard: React.FC<Props> = ({ listing, onPress, onInterested }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(listing)}
      activeOpacity={0.85}
    >
      {/* Image */}
      <Image
        source={{ uri: listing.images[0] }}
        style={styles.image}
        resizeMode="cover"
      />

      {/* Price tag */}
      <View style={styles.priceBadge}>
        <Text style={styles.priceText}>₹{listing.price}</Text>
      </View>

      {/* Condition badge */}
      <View style={[styles.conditionBadge, { borderColor: conditionColor(listing.condition) + '66' }]}>
        <Text style={[styles.conditionText, { color: conditionColor(listing.condition) }]}>
          {listing.condition}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{listing.title}</Text>

        <View style={styles.footer}>
          <Text style={styles.time}>🕐 {timeAgo(listing.createdAt)}</Text>
          <TouchableOpacity
            style={styles.interestedBtn}
            onPress={() => onInterested(listing)}
            activeOpacity={0.8}
          >
            <Text style={styles.interestedText}>👋 Interested</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.interestCount}>🔥 {listing.interestCount} interested</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 140,
  },
  priceBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(15,17,21,0.85)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  priceText: {
    color: Colors.warn,
    fontWeight: '800',
    fontSize: 12,
  },
  conditionBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(15,17,21,0.75)',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  conditionText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    padding: 12,
  },
  title: {
    color: Colors.text,
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  time: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  interestedBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  interestedText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
  },
  interestCount: {
    color: Colors.textDim,
    fontSize: 11,
    marginTop: 6,
  },
});
