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

export const uploadLocalImage = async (uri: string): Promise<UploadResult> => {
  if (!isUploadConfigured()) {
    throw new Error('Photo upload is not set up yet. Add the Cloudinary values in src/utils/chatUpload.ts.');
  }
  const formData = new FormData();
  formData.append('file', { uri, type: 'image/jpeg', name: 'photo.jpg' } as unknown as Blob);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );
  if (!response.ok) throw new Error('Photo upload failed. Please try again.');

  const data = await response.json();
  return { url: data.secure_url, publicId: data.public_id };
};