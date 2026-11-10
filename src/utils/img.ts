// Cloudinary can shrink a photo while sending it. A card needs about 600px, not the 4000px camera original.
export const thumb = (url: string | null | undefined, width = 600): string => {
  if (!url) return '';
  if (!url.includes('res.cloudinary.com') || !url.includes('/image/upload/')) return url;
  if (url.includes('/upload/w_') || url.includes('/upload/q_')) return url;
  return url.replace('/upload/', `/upload/w_${width},c_limit,q_auto,f_auto/`);
};