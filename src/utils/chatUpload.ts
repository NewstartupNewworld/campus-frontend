// Uploads a photo from the phone to Cloudinary and returns a public https link.
// The chat server only accepts https links, never file:// paths from a phone.
// Cloud name and preset are not secrets (preset is unsigned).
const CLOUDINARY_CLOUD_NAME: string = 'dmbvixvns';
const CLOUDINARY_UPLOAD_PRESET: string = 'campusconnect';

export interface UploadResult {
  url: string;
  publicId: string;
}

export const isUploadConfigured = (): boolean =>
  !!CLOUDINARY_CLOUD_NAME &&
  !!CLOUDINARY_UPLOAD_PRESET &&
  CLOUDINARY_CLOUD_NAME !== 'your_cloud_name';

// Reads a photo on the phone and returns it as base64 text (a data URI).
// XMLHttpRequest is used on purpose: fetch().blob() fails on this Expo version.
const readPhoto = (uri: string): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    if (uri.startsWith('data:')) {
      resolve(uri);
      return;
    }
    const xhr = new XMLHttpRequest();
    xhr.onerror = () => reject(new Error('Could not read the photo.'));
    xhr.onload = () => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Could not read the photo.'));
      reader.readAsDataURL(xhr.response as Blob);
    };
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });

export const uploadLocalImage = async (uri: string): Promise<UploadResult> => {
  if (!isUploadConfigured()) {
    throw new Error('Photo upload is not set up yet. Add the Cloudinary values in src/utils/chatUpload.ts.');
  }

  const dataUri = await readPhoto(uri);
  const formData = new FormData();
  formData.append('file', dataUri);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

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