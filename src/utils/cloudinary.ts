import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

// Where to find these (neither value is a secret):
//  - Cloud name: cloudinary.com > Dashboard (top left)
//  - Preset: Settings > Upload > Upload presets > Add upload preset,
//    set "Signing mode" to "Unsigned", then copy the preset name
const CLOUDINARY_CLOUD_NAME = 'your_cloud_name';
const CLOUDINARY_UPLOAD_PRESET = 'your_unsigned_preset';

export interface UploadResult {
  url: string;
  publicId: string;
}

const isConfigured = () =>
  CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' && CLOUDINARY_UPLOAD_PRESET !== 'your_unsigned_preset';

/**
 * Uploads an image that is already on the phone (a file:// uri) and returns its public URL.
 */
export const uploadLocalImage = async (uri: string, folder = 'campus-listings'): Promise<UploadResult> => {
  if (!isConfigured()) {
    throw new Error('Photo upload is not set up yet (Cloudinary values are missing).');
  }
  const formData = new FormData();
  formData.append('file', { uri, type: 'image/jpeg', name: 'photo.jpg' } as unknown as Blob);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );
  if (!response.ok) throw new Error('Photo upload failed. Please try again.');

  const data = await response.json();
  return { url: data.secure_url, publicId: data.public_id };
};

/**
 * Opens the photo library and uploads the chosen image. Returns null if the user cancelled.
 */
export const pickAndUploadImage = async (): Promise<UploadResult | null> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission needed', 'Please allow access to your photos to upload images.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });
  if (result.canceled || !result.assets?.length) return null;
  return uploadLocalImage(result.assets[0].uri);
};

/**
 * Opens the camera and uploads the photo. Returns null if the user cancelled.
 */
export const takeAndUploadPhoto = async (): Promise<UploadResult | null> => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission needed', 'Please allow camera access.');
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });
  if (result.canceled || !result.assets?.length) return null;
  return uploadLocalImage(result.assets[0].uri);
};