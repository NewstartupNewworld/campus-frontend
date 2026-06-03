import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput,
  TouchableOpacity, ScrollView, SafeAreaView,
  ActivityIndicator, Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../theme/colors';
import { ListingCard } from '../../components/ListingCard';

const API_URL = 'https://campus-backend-production-2dbb.up.railway.app';
const CATEGORIES = ['All', 'Books', 'Electronics', 'Clothes', 'Food', 'Others'];
const CONDITIONS = ['All', 'New', 'Like New', 'Good', 'Fair'];
const SORT_OPTIONS = ['Newest', 'Price: Low to High', 'Price: High to Low', 'Most Popular'];

type RootStackParamList = {
  ListingDetail: { listing: any };
  CreateListing: undefined;
  ChatRoom: { chatId: string; listingTitle: string };
};

export const MarketplaceScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeCondition, setActiveCondition] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  const loadListings = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const params = new URLSearchParams();
      if (activeCategory !== 'All') params.append('category', activeCategory);
      if (activeCondition !== 'All') params.append('condition', activeCondition);
      if (search) params.append('search', search);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (sortBy === 'Price: Low to High') params.append('sort', 'price_asc');
      if (sortBy === 'Price: High to Low') params.append('sort', 'price_desc');
      if (sortBy === 'Most Popular') params.append('sort', 'popular');

      const response = await fetch(`${API_URL}/api/listings/feed?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setListings(data.listings || []);
        setTotalCount(data.total || 0);
      }
    } catch (err) {
      console.error('Error loading listings:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, activeCondition, search, minPrice, maxPrice, sortBy]);

  useEffect(() => {
    const timer = setTimeout(loadListings, 300);
    return () => clearTimeout(timer);
  }, [loadListings]);

  const handleInterested = async (listing: any) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/chats/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ listingId: listing.id }),
      });
      const data = await response.json();
      if (response.ok) {
        navigation.navigate('ChatRoom', {
          chatId: data.chatId,
          listingTitle: listing.title,
        });
      }
    } catch (err) {
      console.error('Error creating chat:', err);
    }
  };

  const activeFiltersCount = [
    activeCondition !== 'All',
    minPrice !== '',
    maxPrice !== '',
    sortBy !== 'Newest',
  ].filter(Boolean).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Campus Market</Text>
          <Text style={styles.headerSub}>{totalCount} listings</Text>
        </View>
        <View style={styles.headerBtns}>
          <TouchableOpacity
            style={[styles.filterBtn, activeFiltersCount > 0 && styles.filterBtnActive]}
            onPress={() => setShowFilters(true)}
          >
            <Text style={styles.filterBtnText}>
              🎛 Filters{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sellBtn}
            onPress={() => navigation.navigate('CreateListing')}
          >
            <Text style={styles.sellBtnText}>+ Sell</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search listings..."
          placeholderTextColor={Colors.textDim}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={{ color: Colors.textDim, fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
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

      {/* Listings */}
      {loading ? (
        <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={listings}
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
          onRefresh={loadListings}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>No listings found</Text>
              <Text style={styles.emptySub}>Try different filters or search terms</Text>
            </View>
          }
        />
      )}

      {/* Filter Modal */}
      <Modal visible={showFilters} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Condition */}
            <Text style={styles.filterLabel}>Condition</Text>
            <View style={styles.pillGrid}>
              {CONDITIONS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.pill, activeCondition === c && styles.pillActive]}
                  onPress={() => setActiveCondition(c)}
                >
                  <Text style={[styles.pillText, activeCondition === c && styles.pillTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Price Range */}
            <Text style={styles.filterLabel}>Price Range (₹)</Text>
            <View style={styles.priceRow}>
              <TextInput
                style={styles.priceInput}
                value={minPrice}
                onChangeText={setMinPrice}
                placeholder="Min"
                placeholderTextColor={Colors.textDim}
                keyboardType="numeric"
              />
              <Text style={{ color: Colors.textMuted }}>—</Text>
              <TextInput
                style={styles.priceInput}
                value={maxPrice}
                onChangeText={setMaxPrice}
                placeholder="Max"
                placeholderTextColor={Colors.textDim}
                keyboardType="numeric"
              />
            </View>

            {/* Sort */}
            <Text style={styles.filterLabel}>Sort By</Text>
            <View style={styles.pillGrid}>
              {SORT_OPTIONS.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.pill, sortBy === s && styles.pillActive]}
                  onPress={() => setSortBy(s)}
                >
                  <Text style={[styles.pillText, sortBy === s && styles.pillTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Buttons */}
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => {
                  setActiveCondition('All');
                  setMinPrice('');
                  setMaxPrice('');
                  setSortBy('Newest');
                }}
              >
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => {
                  setShowFilters(false);
                  loadListings();
                }}
              >
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerBtns: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  filterBtn: {
    backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 9,
  },
  filterBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '15' },
  filterBtnText: { color: Colors.text, fontWeight: '700', fontSize: 12 },
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
  emptyWrap: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '700', color: Colors.text },
  emptySub: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.bg, borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 20, paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: Colors.text },
  modalClose: { fontSize: 18, color: Colors.textMuted },
  filterLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginBottom: 10, marginTop: 16,
  },
  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  priceInput: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 10,
    color: Colors.text, fontSize: 14,
  },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 24 },
  resetBtn: {
    flex: 1, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  resetBtnText: { color: Colors.text, fontWeight: '700' },
  applyBtn: {
    flex: 2, backgroundColor: Colors.accent,
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  applyBtnText: { color: '#fff', fontWeight: '800' },
});