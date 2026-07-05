import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Image, ActivityIndicator, Alert, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '../../theme/ThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = 'https://campus-backend-production-2dbb.up.railway.app';
const CATEGORIES = ['Books', 'Electronics', 'Clothes', 'Food', 'Others'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'] as const;

const CATEGORY_ICONS: Record<string, string> = {
  Books: '📚', Electronics: '💻', Clothes: '👕', Food: '🍕', Others: '📦',
};
const CONDITION_COLORS: Record<string, string> = {
  New: '#3DDC84', 'Like New': '#4F8CFF', Good: '#FFB347', Fair: '#FF6B6B',
};

const softShadow = {
  shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
};
const cardShadow = {
  shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.18, shadowRadius: 10, elevation: 5,
};

export const CreateListingScreen = () => {
  const Colors = useColors();
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Books');
  const [condition, setCondition] = useState<typeof CONDITIONS[number]>('Good');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },

    // Header — hairline divider, back pill, post button shadow
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
    backBtn: { width: 34, height: 34, borderRadius: 11, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', ...softShadow },
    backText: { color: Colors.text, fontSize: 18 },
    headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
    postBtn: { backgroundColor: Colors.accent, borderRadius: 11, paddingHorizontal: 15, paddingVertical: 7, ...softShadow },
    postBtnText: { color: '#fff', fontWeight: '800', fontSize: 13.5 },

    form: { padding: 16, paddingBottom: 40 },
    label: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 10, marginTop: 20 },

    // Image row
    imagesRow: { flexDirection: 'row', marginBottom: 4 },
    imageWrap: { position: 'relative', marginRight: 10 },
    imageThumb: { width: 96, height: 96, borderRadius: 14 },
    removeImage: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 10, width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
    mainBadge: { position: 'absolute', bottom: 5, left: 5, backgroundColor: Colors.accent, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    mainBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
    addImageBtn: { width: 96, height: 96, borderRadius: 14, borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' },
    addImageText: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
    addImageSub: { color: Colors.textDim, fontSize: 10 },

    // Inputs — shadow, no border
    input: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, color: Colors.text, fontSize: 14, ...softShadow },
    multiline: { height: 110, paddingTop: 14 },
    charCount: { textAlign: 'right', fontSize: 11, color: Colors.textDim, marginTop: 4 },

    // Price wrap — shadow, no border
    priceWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 14, paddingHorizontal: 14, ...softShadow },
    priceSymbol: { fontSize: 18, fontWeight: '800', color: Colors.accent, marginRight: 8 },
    priceInput: { flex: 1, color: Colors.text, fontSize: 22, fontWeight: '800', paddingVertical: 12 },

    // Category cards — shadow, no border; active = accent tint
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    categoryCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.card, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, ...softShadow },
    categoryCardActive: { backgroundColor: Colors.accent + '18' },
    categoryIcon: { fontSize: 17 },
    categoryText: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
    categoryTextActive: { color: Colors.accent },

    // Condition buttons — shadow, no border; active = color tint
    conditionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    conditionBtn: { flex: 1, minWidth: '20%', backgroundColor: Colors.card, borderRadius: 12, paddingVertical: 10, alignItems: 'center', ...softShadow },
    conditionText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },

    // Tips card — accent tint, shadow
    tipsCard: { backgroundColor: Colors.accent + '10', borderRadius: 14, padding: 14, marginTop: 20, ...softShadow },
    tipsTitle: { fontSize: 13, fontWeight: '800', color: Colors.accent, marginBottom: 8 },
    tipText: { fontSize: 12, color: Colors.textMuted, lineHeight: 22 },

    // Submit — gradient button
    submitBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 24, ...softShadow },
    submitBtnGradient: { paddingVertical: 16, alignItems: 'center' },
    submitText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  });

  const handleAddImage = async () => {
    Alert.alert('Add Photo', 'Choose an option', [
      { text: '📷 Camera', onPress: async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow camera access.'); return; }
        const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.8 });
        if (!result.canceled && result.assets[0]) setImages(prev => [...prev, result.assets[0].uri]);
      }},
      { text: '🖼️ Gallery', onPress: async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow photo library access.'); return; }
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.8 });
        if (!result.canceled && result.assets[0]) setImages(prev => [...prev, result.assets[0].uri]);
      }},
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleRemoveImage = (index: number) => setImages(prev => prev.filter((_, i) => i !== index));

  const uploadToCloudinary = async (uri: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', { uri, type: 'image/jpeg', name: 'upload.jpg' } as any);
    formData.append('upload_preset', 'campusconnect');
    formData.append('cloud_name', 'dmbvixvns');
    const res = await fetch('https://api.cloudinary.com/v1_1/dmbvixvns/image/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (!data.secure_url) throw new Error('Image upload failed');
    return data.secure_url;
  };

  const handleSubmit = async () => {
    if (!title.trim()) { Alert.alert('Missing title', 'Please enter a title for your listing.'); return; }
    if (!price.trim() || isNaN(parseFloat(price))) { Alert.alert('Invalid price', 'Please enter a valid price.'); return; }
    if (images.length === 0) { Alert.alert('No image', 'Please add at least one photo.'); return; }
    setSubmitting(true);
    try {
      setUploading(true);
      const uploadedUrls = await Promise.all(images.map(uri => uploadToCloudinary(uri)));
      setUploading(false);
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), price: parseFloat(price), condition, category, images: uploadedUrls }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create listing');
      Alert.alert('🎉 Listed!', 'Your item is now visible on Campus Market.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err: any) {
      setUploading(false);
      Alert.alert('Error', err.message || 'Could not create listing. Please try again.');
    } finally { setSubmitting(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Listing</Text>
        <TouchableOpacity style={[styles.postBtn, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.postBtnText}>Post</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>

        {/* Photos */}
        <Text style={styles.label}>📸 Photos</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesRow}>
          {images.map((uri, i) => (
            <View key={i} style={styles.imageWrap}>
              <Image source={{ uri }} style={styles.imageThumb} />
              <TouchableOpacity style={styles.removeImage} onPress={() => handleRemoveImage(i)}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>✕</Text>
              </TouchableOpacity>
              {i === 0 && <View style={styles.mainBadge}><Text style={styles.mainBadgeText}>Main</Text></View>}
            </View>
          ))}
          {images.length < 5 && (
            <TouchableOpacity style={styles.addImageBtn} onPress={handleAddImage} disabled={uploading}>
              {uploading ? <ActivityIndicator color={Colors.accent} /> : (
                <>
                  <Text style={{ fontSize: 30 }}>+</Text>
                  <Text style={styles.addImageText}>Add photo</Text>
                  <Text style={styles.addImageSub}>{images.length}/5</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Title */}
        <Text style={styles.label}>📝 Title</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="What are you selling?" placeholderTextColor={Colors.textDim} maxLength={100} />

        {/* Price */}
        <Text style={styles.label}>💰 Price (₹)</Text>
        <View style={styles.priceWrap}>
          <Text style={styles.priceSymbol}>₹</Text>
          <TextInput style={styles.priceInput} value={price} onChangeText={setPrice} placeholder="0" placeholderTextColor={Colors.textDim} keyboardType="numeric" />
        </View>

        {/* Category */}
        <Text style={styles.label}>🏷️ Category</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat} style={[styles.categoryCard, category === cat && styles.categoryCardActive]} onPress={() => setCategory(cat)}>
              <Text style={styles.categoryIcon}>{CATEGORY_ICONS[cat]}</Text>
              <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Condition */}
        <Text style={styles.label}>⭐ Condition</Text>
        <View style={styles.conditionRow}>
          {CONDITIONS.map(cond => {
            const color = CONDITION_COLORS[cond];
            const isActive = condition === cond;
            return (
              <TouchableOpacity
                key={cond}
                style={[styles.conditionBtn, isActive && { backgroundColor: color + '22' }]}
                onPress={() => setCondition(cond)}
              >
                <Text style={[styles.conditionText, isActive && { color }]}>{cond}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Description */}
        <Text style={styles.label}>📄 Description</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe your item — condition details, usage, any defects..."
          placeholderTextColor={Colors.textDim}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={500}
        />
        <Text style={styles.charCount}>{description.length}/500</Text>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Tips for a quick sale</Text>
          <Text style={styles.tipText}>• Add clear, well-lit photos</Text>
          <Text style={styles.tipText}>• Set a fair price — check similar listings</Text>
          <Text style={styles.tipText}>• Be honest about condition</Text>
        </View>

        {/* Submit — gradient */}
        <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}>
          <LinearGradient colors={[Colors.accent, Colors.accentAlt]} style={styles.submitBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>🚀 Post Listing</Text>}
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};