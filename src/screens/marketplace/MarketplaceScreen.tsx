import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Modal, Image, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../theme/ThemeProvider';

const API_URL = 'https://campus-backend-arfy.onrender.com';
const CATEGORIES = ['All', 'Books', 'Electronics', 'Clothes', 'Food', 'Others'];
const CONDITIONS = ['All', 'New', 'Like New', 'Good', 'Fair'];
const SORT_OPTIONS = ['Newest', 'Price: Low to High', 'Price: High to Low', 'Most Popular'];
const SEARCH_HISTORY_KEY = 'marketplaceSearchHistory';
const MAX_HISTORY = 8;
const PRIMARY = '#2F54EB';

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (isNaN(d) || d < 1) return 'today';
  if (d === 1) return '1 day ago';
  if (d < 7) return `${d} days ago`;
  return `${Math.floor(d / 7)} wk ago`;
};

export const MarketplaceScreen = () => {
  const Colors = useColors();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeCondition, setActiveCondition] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
        if (saved) setSearchHistory(JSON.parse(saved));
      } catch (e) {}
    })();
  }, []);

  const saveSearchToHistory = useCallback((term: string) => {
    if (!term.trim()) return;
    setSearchHistory((prev) => {
      const updated = [term, ...prev.filter((h) => h.toLowerCase() !== term.toLowerCase())].slice(0, MAX_HISTORY);
      AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFromHistory = (term: string) => {
    setSearchHistory((prev) => {
      const updated = prev.filter((h) => h !== term);
      AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    setSearchHistory([]);
    AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
  };
  const handleSearchSubmit = () => {
    if (search.trim()) saveSearchToHistory(search.trim());
    setSearchFocused(false);
  };
  const handleHistoryTap = (term: string) => {
    setSearch(term);
    saveSearchToHistory(term);
    setSearchFocused(false);
  };

  const loadListings = useCallback(async () => {
    try {
      setLoading(true);
      setErrorState(false);
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
      } else {
        setErrorState(true);
      }
    } catch (err) {
      console.error('Error loading listings:', err);
      setErrorState(true);
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ listingId: listing.id }),
      });
      const data = await response.json();
      if (response.ok) {
        navigation.navigate('ChatRoom', { chatId: data.chatId, listingTitle: listing.title });
      } else {
        Alert.alert('Could not start chat', data?.error || 'Please try again.');
      }
    } catch (err) {
      Alert.alert('No connection', 'Check your internet and try again.');
    }
  };

  const activeFiltersCount = [
    activeCondition !== 'All', minPrice !== '', maxPrice !== '', sortBy !== 'Newest',
  ].filter(Boolean).length;
  const showHistoryDropdown = searchFocused && search.length === 0 && searchHistory.length > 0;

  const renderItem = ({ item }: { item: any }) => {
    const img = Array.isArray(item.images) && item.images.length ? item.images[0] : null;
    const interested = Number(item.interest_count) || 0;
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('ListingDetail', { listing: item })}
        accessibilityRole="button"
        accessibilityLabel={item.title}
      >
        <View style={styles.photo}>
          {img ? (
            <Image source={{ uri: img }} style={styles.photoImg} resizeMode="cover" />
          ) : (
            <Ionicons name="image-outline" size={30} color={Colors.textDim} />
          )}
          {!!item.condition && (
            <View style={styles.condChip}>
              <Text style={styles.condText}>{item.condition}</Text>
            </View>
          )}
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{'\u20B9'}{Math.round(Number(item.price))}</Text>
            <Text style={styles.meta}>{timeAgo(item.created_at)}  |  {item.category}</Text>
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.interest}>
              {interested > 0 ? `${interested} interested` : 'Be the first to ask'}
            </Text>
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() => handleInterested(item)}
              accessibilityRole="button"
              accessibilityLabel={`Chat about ${item.title}`}
            >
              <Ionicons name="chatbubble-ellipses" size={16} color="#FFFFFF" />
              <Text style={styles.chatBtnText}>Chat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Market</Text>
          <Text style={styles.headerSub}>
            {totalCount} {totalCount === 1 ? 'listing' : 'listings'} on your campus
          </Text>
        </View>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.navigate('Chats')}
          accessibilityRole="button"
          accessibilityLabel="Messages"
        >
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={Colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sellBtn}
          onPress={() => navigation.navigate('CreateListing')}
          accessibilityRole="button"
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.sellText}>Sell</Text>
        </TouchableOpacity>
      </View>

      {/* Market sections */}
      <View style={styles.chipsRow}>
        <View style={[styles.chip, styles.chipActive]}>
          <Text style={styles.chipTextActive}>Buy &amp; Sell</Text>
        </View>
        <TouchableOpacity
          style={styles.chip}
          onPress={() => navigation.navigate('Roommate')}
          accessibilityRole="button"
        >
          <Text style={styles.chipText}>Roommates</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.chip}
          onPress={() => navigation.navigate('LostFound')}
          accessibilityRole="button"
        >
          <Text style={styles.chipText}>Lost &amp; Found</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
          placeholder="Search listings"
          placeholderTextColor={Colors.textMuted}
        />
        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearch('')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.filterBtn, activeFiltersCount > 0 && { backgroundColor: Colors.accent + '2E' }]}
          onPress={() => setShowFilters(true)}
          accessibilityRole="button"
          accessibilityLabel="Filters"
        >
          <Ionicons name="options" size={18} color={activeFiltersCount > 0 ? Colors.accent : Colors.text} />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {showHistoryDropdown && (
        <View style={styles.historyDropdown}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Recent searches</Text>
            <TouchableOpacity onPress={clearHistory} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.historyClear}>Clear all</Text>
            </TouchableOpacity>
          </View>
          {searchHistory.map((term) => (
            <TouchableOpacity key={term} style={styles.historyRow} onPress={() => handleHistoryTap(term)}>
              <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.historyText}>{term}</Text>
              <TouchableOpacity
                onPress={() => removeFromHistory(term)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel={`Remove ${term}`}
              >
                <Ionicons name="close" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categories}
        contentContainerStyle={styles.categoriesContent}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.pill, activeCategory === cat && styles.pillActive]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[styles.pillText, activeCategory === cat && styles.pillTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Loading, error, empty, list */}
      {loading && listings.length === 0 ? (
        <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
      ) : errorState ? (
        <View style={styles.stateWrap}>
          <Ionicons name="warning-outline" size={34} color={Colors.warn} />
          <Text style={styles.stateTitle}>Something went wrong</Text>
          <Text style={styles.stateSub}>We could not load the listings.</Text>
          <TouchableOpacity style={styles.stateBtn} onPress={loadListings} accessibilityRole="button">
            <Text style={styles.stateBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={listings}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={loadListings}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.stateWrap}>
              <Ionicons name="storefront-outline" size={34} color={Colors.textMuted} />
              <Text style={styles.stateTitle}>No listings found</Text>
              <Text style={styles.stateSub}>Try other filters, or be the first to sell something.</Text>
              <TouchableOpacity
                style={styles.stateBtn}
                onPress={() => navigation.navigate('CreateListing')}
                accessibilityRole="button"
              >
                <Text style={styles.stateBtnText}>Add a listing</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Filters */}
      <Modal visible={showFilters} animationType="slide" transparent onRequestClose={() => setShowFilters(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity
                onPress={() => setShowFilters(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Close filters"
              >
                <Ionicons name="close" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterLabel}>Condition</Text>
            <View style={styles.pillGrid}>
              {CONDITIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.pill, activeCondition === c && styles.pillActive]}
                  onPress={() => setActiveCondition(c)}
                >
                  <Text style={[styles.pillText, activeCondition === c && styles.pillTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterLabel}>Price range ({'\u20B9'})</Text>
            <View style={styles.priceInputs}>
              <TextInput
                style={styles.priceInput}
                value={minPrice}
                onChangeText={setMinPrice}
                placeholder="Min"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
              />
              <Text style={{ color: Colors.textMuted }}>to</Text>
              <TextInput
                style={styles.priceInput}
                value={maxPrice}
                onChangeText={setMaxPrice}
                placeholder="Max"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.filterLabel}>Sort by</Text>
            <View style={styles.pillGrid}>
              {SORT_OPTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.pill, sortBy === s && styles.pillActive]}
                  onPress={() => setSortBy(s)}
                >
                  <Text style={[styles.pillText, sortBy === s && styles.pillTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

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
              <TouchableOpacity style={styles.applyBtn} onPress={() => setShowFilters(false)}>
                <Text style={styles.applyBtnText}>Apply filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const makeStyles = (Colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },

    header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
    headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
    headerSub: { fontSize: 13, color: Colors.textMuted, marginTop: 1 },
    iconBtn: {
      width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.card,
      borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center',
    },
    sellBtn: {
      height: 44, borderRadius: 22, backgroundColor: PRIMARY, flexDirection: 'row',
      alignItems: 'center', gap: 4, paddingHorizontal: 16,
    },
    sellText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

    chipsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 6, marginBottom: 10 },
    chip: {
      height: 40, borderRadius: 20, paddingHorizontal: 16, backgroundColor: Colors.card,
      borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center',
    },
    chipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
    chipText: { fontSize: 13.5, fontWeight: '600', color: Colors.textMuted },
    chipTextActive: { fontSize: 13.5, fontWeight: '700', color: '#FFFFFF' },

    searchWrap: {
      flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 8,
      height: 48, backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1,
      borderColor: Colors.border, paddingLeft: 14, paddingRight: 6,
    },
    searchInput: { flex: 1, color: Colors.text, fontSize: 14, paddingVertical: 0 },
    filterBtn: {
      width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.cardAlt,
      alignItems: 'center', justifyContent: 'center',
    },
    filterBadge: {
      position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8,
      backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
    },
    filterBadgeText: { color: '#FFFFFF', fontSize: 9.5, fontWeight: '800' },

    historyDropdown: {
      backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
      marginHorizontal: 16, marginBottom: 8, padding: 10,
    },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, paddingHorizontal: 6 },
    historyTitle: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
    historyClear: { fontSize: 12, fontWeight: '700', color: Colors.accent },
    historyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, paddingHorizontal: 6 },
    historyText: { flex: 1, fontSize: 14, color: Colors.text },

    categories: { flexGrow: 0, flexShrink: 0, marginBottom: 6 },
    categoriesContent: { paddingHorizontal: 16, gap: 8 },
    pill: {
      minHeight: 36, justifyContent: 'center', borderRadius: 18, paddingHorizontal: 14,
      backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    },
    pillActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
    pillText: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
    pillTextActive: { color: '#FFFFFF', fontWeight: '700' },

    listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 110 },
    card: {
      backgroundColor: Colors.card, borderRadius: 20, borderWidth: 1, borderColor: Colors.border,
      overflow: 'hidden', marginBottom: 14,
    },
    photo: { height: 170, backgroundColor: Colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
    photoImg: { width: '100%', height: '100%' },
    condChip: {
      position: 'absolute', left: 12, top: 12, backgroundColor: 'rgba(11,15,26,0.75)',
      borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
    },
    condText: { color: '#F1F5F9', fontSize: 11, fontWeight: '700' },
    cardBody: { padding: 14 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 3 },
    price: { fontSize: 17, fontWeight: '800', color: Colors.accent },
    meta: { fontSize: 12, color: Colors.textMuted },
    cardFooter: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border,
    },
    interest: { fontSize: 12.5, color: Colors.textMuted },
    chatBtn: {
      height: 44, borderRadius: 22, backgroundColor: PRIMARY, flexDirection: 'row',
      alignItems: 'center', gap: 6, paddingHorizontal: 18,
    },
    chatBtnText: { color: '#FFFFFF', fontSize: 13.5, fontWeight: '700' },

    stateWrap: { alignItems: 'center', marginTop: 50, paddingHorizontal: 24, gap: 6 },
    stateTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 6 },
    stateSub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
    stateBtn: {
      marginTop: 12, minHeight: 44, borderRadius: 22, backgroundColor: PRIMARY,
      paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center',
    },
    stateBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalCard: {
      backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      borderWidth: 1, borderBottomWidth: 0, borderColor: Colors.border, padding: 20,
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
    filterLabel: {
      fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase',
      letterSpacing: 0.6, marginBottom: 10, marginTop: 16,
    },
    pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    priceInputs: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    priceInput: {
      flex: 1, height: 48, backgroundColor: Colors.bg, borderRadius: 12, borderWidth: 1,
      borderColor: Colors.border, paddingHorizontal: 14, color: Colors.text, fontSize: 14,
    },
    modalBtns: { flexDirection: 'row', gap: 12, marginTop: 24 },
    resetBtn: {
      flex: 1, minHeight: 48, borderRadius: 14, backgroundColor: Colors.bg, borderWidth: 1,
      borderColor: Colors.border, alignItems: 'center', justifyContent: 'center',
    },
    resetBtnText: { color: Colors.text, fontWeight: '700' },
    applyBtn: { flex: 2, minHeight: 48, borderRadius: 14, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center' },
    applyBtnText: { color: '#FFFFFF', fontWeight: '800' },
  });