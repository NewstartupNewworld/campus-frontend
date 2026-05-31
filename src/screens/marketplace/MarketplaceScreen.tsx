import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput,
  TouchableOpacity, ScrollView, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../theme/colors';
import { ListingCard } from '../../components/ListingCard';

const CATEGORIES = ['All', 'Books', 'Electronics', 'Clothes', 'Food', 'Others'];

const MOCK_LISTINGS = [
  {
    id: '1', title: 'Engineering Mathematics Vol 3', price: 299,
    condition: 'Like New', category: 'Books',
    images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80'],
    college: 'IIT Kharagpur', interestCount: 4,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    description: 'Covers Linear Algebra, Differential Equations. Used one semester only.',
    sellerId: 's1',
  },
  {
    id: '2', title: 'Dell XPS 13 Charger (45W)', price: 850,
    condition: 'Good', category: 'Electronics',
    images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&q=80'],
    college: 'IIT Kharagpur', interestCount: 7,
    createdAt: new Date(Date.now() - 18000000).toISOString(),
    description: 'Original Dell charger, works perfectly.',
    sellerId: 's2',
  },
  {
    id: '3', title: 'Mechanical Keyboard (TKL)', price: 1800,
    condition: 'Like New', category: 'Electronics',
    images: ['https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&q=80'],
    college: 'IIT Kharagpur', interestCount: 12,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    description: 'Blue switches. Very clicky. Used 3 months.',
    sellerId: 's3',
  },
  {
    id: '4', title: 'Python Crash Course (2nd Ed)', price: 180,
    condition: 'Fair', category: 'Books',
    images: ['https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&q=80'],
    college: 'IIT Kharagpur', interestCount: 2,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    description: 'Some pencil marks in chapters 4-6. Great for beginners.',
    sellerId: 's4',
  },
  {
    id: '5', title: 'Noise Cancelling Headphones', price: 2200,
    condition: 'Good', category: 'Electronics',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80'],
    college: 'IIT Kharagpur', interestCount: 9,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    description: 'Sony WH-1000XM3. Battery life still excellent.',
    sellerId: 's5',
  },
  {
    id: '6', title: 'Nike Sports Shoes (Size 9)', price: 1200,
    condition: 'Good', category: 'Clothes',
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80'],
    college: 'IIT Kharagpur', interestCount: 3,
    createdAt: new Date(Date.now() - 345600000).toISOString(),
    description: 'Worn only a few times. No damage.',
    sellerId: 's6',
  },
];

type RootStackParamList = {
  ListingDetail: { listing: any };
  CreateListing: undefined;
  ChatRoom: { chatId: string; listingTitle: string };
};

export const MarketplaceScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = MOCK_LISTINGS.filter(l =>
    (activeCategory === 'All' || l.category === activeCategory) &&
    l.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleInterested = (listing: any) => {
    navigation.navigate('ChatRoom', {
      chatId: `chat_${listing.id}`,
      listingTitle: listing.title,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Campus Market</Text>
          <Text style={styles.headerSub}>IIT Kharagpur • {MOCK_LISTINGS.length} listings</Text>
        </View>
        <TouchableOpacity
          style={styles.sellBtn}
          onPress={() => navigation.navigate('CreateListing')}
        >
          <Text style={styles.sellBtnText}>+ Sell</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search listings..."
          placeholderTextColor={Colors.textDim}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categories}
        contentContainerStyle={styles.categoriesContent}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.pill, activeCategory === cat && styles.pillActive]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[styles.pillText, activeCategory === cat && styles.pillTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        renderItem={({ item }) => (
          <ListingCard
            listing={item}
            onPress={(l) => navigation.navigate('ListingDetail', { listing: l })}
            onInterested={handleInterested}
          />
        )}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.empty}>No listings found 😔</Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: Colors.text },
  headerSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  sellBtn: {
    backgroundColor: Colors.accent, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 9,
  },
  sellBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1,
    borderColor: Colors.border, marginHorizontal: 16, marginBottom: 8,
    paddingHorizontal: 12,
  },
  searchIcon: { fontSize: 14, marginRight: 6 },
  searchInput: { flex: 1, color: Colors.text, fontSize: 14, paddingVertical: 10 },
  categories: { flexGrow: 0, marginBottom: 8 },
  categoriesContent: { paddingHorizontal: 16, gap: 8 },
  pill: {
    backgroundColor: Colors.card, borderRadius: 20, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 6,
  },
  pillActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  pillText: { color: Colors.textMuted, fontSize: 12, fontWeight: '700' },
  pillTextActive: { color: '#fff' },
  row: { justifyContent: 'space-between', paddingHorizontal: 16 },
  listContent: { paddingBottom: 20 },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
});
