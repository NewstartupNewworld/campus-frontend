import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
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
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 12,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    image: {
      width: '100%',
      height: 130,
      backgroundColor: Colors.cardAlt,
    },
    priceBadge: {
      position: 'absolute',
      top: 8,
      left: 8,
      backgroundColor: 'rgba(0,0,0,0.65)',
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    priceText: {
      color: '#fff',
      fontWeight: '800',
      fontSize: 13,
    },
    conditionBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: 'rgba(0,0,0,0.55)',
      borderRadius: 6,
      borderWidth: 1,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    conditionText: {
      fontSize: 10,
      fontWeight: '700',
    },
    content: {
      padding: 10,
    },
    title: {
      fontSize: 13,
      fontWeight: '700',
      color: Colors.text,
      marginBottom: 6,
      lineHeight: 18,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    time: {
      fontSize: 11,
      color: Colors.textDim,
    },
    interestedBtn: {
      backgroundColor: Colors.accent,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    interestedText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '700',
    },
    interestCount: {
      fontSize: 11,
      color: Colors.textMuted,
      marginTop: 4,
    },
  });

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(listing)} activeOpacity={0.85}>
      <Image
        source={{ uri: listing.images?.[0] }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.priceBadge}>
        <Text style={styles.priceText}>₹{listing.price}</Text>
      </View>
      <View style={[styles.conditionBadge, { borderColor: conditionColor(listing.condition) + '66' }]}>
        <Text style={[styles.conditionText, { color: conditionColor(listing.condition) }]}>
          {listing.condition}
        </Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{listing.title}</Text>
        <View style={styles.footer}>
          <Text style={styles.time}>🕐 {timeAgo(listing.created_at)}</Text>
          <TouchableOpacity style={styles.interestedBtn} onPress={() => onInterested(listing)}>
            <Text style={styles.interestedText}>👋 Interested</Text>
          </TouchableOpacity>
        </View>
        {listing.interest_count > 0 && (
          <Text style={styles.interestCount}>🔥 {listing.interest_count} interested</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};