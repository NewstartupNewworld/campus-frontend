// Uploads a photo from the phone to Cloudinary and returns a public https link.
// The photo is read as base64 first, because newer React Native no longer
// accepts the old { uri, type, name } object inside FormData.
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

const toDataUri = async (uri: string): Promise<string> => {
  const blob = await (await fetch(uri)).blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read the photo.'));
    reader.readAsDataURL(blob);
  });
};

export const uploadLocalImage = async (uri: string): Promise<UploadResult> => {
  if (!isUploadConfigured()) {
    throw new Error('Photo upload is not set up yet. Add the Cloudinary values in src/utils/chatUpload.ts.');
  }

  const dataUri = await toDataUri(uri);
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