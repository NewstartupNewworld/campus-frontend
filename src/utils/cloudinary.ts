import * as ImagePicker from 'expo-image-picker';

// Replace with your Cloudinary credentials
const CLOUDINARY_CLOUD_NAME = 'your_cloud_name';
const CLOUDINARY_UPLOAD_PRESET = 'your_unsigned_preset'; // Create an unsigned preset in Cloudinary dashboard

export interface UploadResult {
  url: string;
  publicId: string;
}

/**
 * Opens image picker and uploads selected image to Cloudinary.
 * Returns the secure URL, or null if user cancelled.
 */
export const pickAndUploadImage = async (): Promise<UploadResult | null> => {
  // Request media library permissions
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    alert('Camera roll permission is required to upload images.');
    return null;
  }

  // Launch picker
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (result.canceled || !result.assets?.length) return null;

  const asset = result.assets[0];

  // Build multipart form data
  const formData = new FormData();
  formData.append('file', {
    uri: asset.uri,
    type: 'image/jpeg',
    name: 'listing.jpg',
  } as unknown as Blob);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'campus-listings');

  // Upload to Cloudinary
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) throw new Error('Cloudinary upload failed');

  const data = await response.json();
  return {
    url: data.secure_url,
    publicId: data.public_id,
  };
};

/**
 * Opens camera and uploads photo to Cloudinary.
 */
export const takeAndUploadPhoto = async (): Promise<UploadResult | null> => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    alert('Camera permission is required.');
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (result.canceled || !result.assets?.length) return null;

  const asset = result.assets[0];
  const formData = new FormData();
  formData.append('file', { uri: asset.uri, type: 'image/jpeg', name: 'photo.jpg' } as unknown as Blob);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'campus-listings');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) throw new Error('Cloudinary upload failed');
  const data = await response.json();
  return { url: data.secure_url, publicId: data.public_id };
};
