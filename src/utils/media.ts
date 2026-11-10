import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { uploadLocalImage } from './chatUpload';

const CLOUDINARY_CLOUD_NAME = 'dmbvixvns';
const CLOUDINARY_UPLOAD_PRESET = 'campusconnect';
const MAX_VIDEO_BYTES = 30 * 1024 * 1024;
const MAX_VIDEO_SECONDS = 30;

export type PickedMedia = { uri: string; kind: 'image' | 'video' };

// A video link from Cloudinary has /video/upload/ in it. Photos and videos are saved in the same column.
export const isVideoUrl = (url?: string | null): boolean =>
  !!url && (url.includes('/video/upload/') || /\.(mp4|mov|webm|m4v)(\?|$)/i.test(url));

/** Opens the gallery or the camera and returns the chosen photo or short video (null if cancelled). */
export async function pickMedia(source: 'library' | 'camera'): Promise<PickedMedia | null> {
  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission needed', source === 'camera' ? 'Please allow camera access.' : 'Please allow access to your photos.');
    return null;
  }

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images', 'videos'],
    quality: 0.7,
    videoMaxDuration: MAX_VIDEO_SECONDS,
  };
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || result.assets.length === 0) return null;

  const asset = result.assets[0];
  const kind = asset.type === 'video' ? 'video' : 'image';
  if (kind === 'video') {
    if (asset.fileSize && asset.fileSize > MAX_VIDEO_BYTES) {
      throw new Error('This video is too big. Please choose one under 30 MB.');
    }
    if (asset.duration && asset.duration > (MAX_VIDEO_SECONDS + 1) * 1000) {
      throw new Error('Please choose a video of 30 seconds or less.');
    }
  }
  return { uri: asset.uri, kind };
}

// Sent in pieces straight from the phone, so a big video is not loaded into memory
const uploadVideo = (uri: string): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    const form = new FormData();
    form.append('file', { uri, type: 'video/mp4', name: 'video.mp4' } as any);
    form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`);
    xhr.timeout = 120000;
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) resolve(String(data.secure_url));
        else reject(new Error(data?.error?.message || 'Video upload failed. Please try again.'));
      } catch {
        reject(new Error('Video upload failed. Please try again.'));
      }
    };
    xhr.onerror = () => reject(new Error('Could not upload the video. Check your internet.'));
    xhr.ontimeout = () => reject(new Error('The video took too long to upload.'));
    xhr.send(form as any);
  });

/** Uploads the chosen photo or video and returns its https link. */
export async function uploadMedia(media: PickedMedia): Promise<string> {
  if (media.kind === 'video') return uploadVideo(media.uri);
  return (await uploadLocalImage(media.uri)).url;
}