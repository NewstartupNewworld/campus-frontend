import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

// Neither value is a secret. The preset is "unsigned" (Cloudinary > Settings > Upload > Upload presets).
const CLOUDINARY_CLOUD_NAME: string = 'dmbvixvns';
const CLOUDINARY_UPLOAD_PRESET: string = 'campusconnect';

export interface UploadResult {
  url: string;
  publicId: string;
}

const isConfigured = (): boolean =>
  !!CLOUDINARY_CLOUD_NAME &&
  !!CLOUDINARY_UPLOAD_PRESET &&
  CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
  CLOUDINARY_UPLOAD_PRESET !== 'your_unsigned_preset';

// Newer React Native no longer accepts { uri, type, name } inside FormData,
// so the photo is read as base64 and sent as plain text instead.
const toDataUri = async (uri: string): Promise<string> => {
  const blob = await (await fetch(uri)).blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read the photo.'));
    reader.readAsDataURL(blob);
  });
};

/**
 * Uploads an image that is already on the phone (a file:// uri) and returns its public URL.
 */
export const uploadLocalImage = async (uri: string, folder = 'campus-listings'): Promise<UploadResult> => {
  if (!isConfigured()) {
    throw new Error('Photo upload is not set up yet (Cloudinary values are missing).');
  }
  const dataUri = await toDataUri(uri);
  const formData = new FormData();
  formData.append('file', dataUri);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.secure_url) {
    throw new Error(data?.error?.message || 'Photo upload failed. Please try again.');
  }
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
    quality: 0.7,
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
    quality: 0.7,
  });
  if (result.canceled || !result.assets?.length) return null;
  return uploadLocalImage(result.assets[0].uri);
};