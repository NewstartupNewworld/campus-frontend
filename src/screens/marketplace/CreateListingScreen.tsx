import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Image, ActivityIndicator, Alert, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../theme/colors';
import { pickAndUploadImage } from '../../utils/cloudinary';
import { createListing } from '../../api/listings';

const CATEGORIES = ['Books', 'Electronics', 'Clothes', 'Food', 'Others'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'] as const;

export const CreateListingScreen = () => {
  const navigation = useNavigation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Books');
  const [condition, setCondition] = useState<typeof CONDITIONS[number]>('Good');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAddImage = async () => {
    setUploading(true);
    try {
      const result = await pickAndUploadImage();
      if (result) setImages(prev => [...prev, result.url]);
    } catch {
      Alert.alert('Upload failed', 'Could not upload image. Try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !price.trim()) {
      Alert.alert('Missing fields', 'Title and price are required.');
      return;
    }
    if (images.length === 0) {
      Alert.alert('No image', 'Please add at least one image.');
      return;
    }
    setSubmitting(true);
    try {
      await createListing({
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        condition,
        category,
        images,
      });
      Alert.alert('🎉 Listed!', 'Your item is now visible on Campus Market.');
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Could not create listing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Listing</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        {/* Image Picker */}
        <Text style={styles.label}>Photos</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesRow}>
          {images.map((uri, i) => (
            <Image key={i} source={{ uri }} style={styles.imageThumb} />
          ))}
          <TouchableOpacity style={styles.addImageBtn} onPress={handleAddImage} disabled={uploading}>
            {uploading
              ? <ActivityIndicator color={Colors.accent} />
              : <>
                  <Text style={{ fontSize: 28 }}>📸</Text>
                  <Text style={styles.addImageText}>Add photo</Text>
                </>
            }
          </TouchableOpacity>
        </ScrollView>

        {/* Title */}
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Python Crash Course 2nd Ed"
          placeholderTextColor={Colors.textDim}
        />

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the item honestly..."
          placeholderTextColor={Colors.textDim}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Price */}
        <Text style={styles.label}>Price (₹)</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          placeholder="e.g. 350"
          placeholderTextColor={Colors.textDim}
          keyboardType="numeric"
        />

        {/* Category */}
        <Text style={styles.label}>Category</Text>
        <View style={styles.pills}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.pill, category === cat && styles.pillActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.pillText, category === cat && styles.pillTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Condition */}
        <Text style={styles.label}>Condition</Text>
        <View style={styles.pills}>
          {CONDITIONS.map(cond => (
            <TouchableOpacity
              key={cond}
              style={[styles.pill, condition === cond && styles.pillConditionActive]}
              onPress={() => setCondition(cond)}
            >
              <Text style={[styles.pillText, condition === cond && { color: Colors.success }]}>{cond}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitText}>🚀 Post Listing</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backText: { color: Colors.text, fontSize: 22 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  form: { padding: 16, paddingBottom: 40 },
  label: {
    fontSize: 11, fontWeight: '700', color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8, marginTop: 16,
  },
  imagesRow: { flexDirection: 'row', marginBottom: 4 },
  imageThumb: { width: 90, height: 90, borderRadius: 10, marginRight: 8 },
  addImageBtn: {
    width: 90, height: 90, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed',
    backgroundColor: Colors.card,
    alignItems: 'center', justifyContent: 'center',
  },
  addImageText: { color: Colors.textMuted, fontSize: 11, marginTop: 4 },
  input: {
    backgroundColor: Colors.card, borderRadius: 10, borderWidth: 1,
    borderColor: Colors.border, padding: 12,
    color: Colors.text, fontSize: 14,
  },
  multiline: { height: 100 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    backgroundColor: Colors.card, borderRadius: 20, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 7,
  },
  pillActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  pillConditionActive: { backgroundColor: Colors.success + '22', borderColor: Colors.success + '66' },
  pillText: { color: Colors.textMuted, fontSize: 12, fontWeight: '700' },
  pillTextActive: { color: '#fff' },
  submitBtn: {
    backgroundColor: Colors.accent, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center', marginTop: 28,
  },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
