// Client-side image compression to base64 data URLs.
// No external storage (Firebase Storage/GCS) needed, so it's 100% free
// and works without enabling the Blaze plan. Images are resized + re-encoded
// (WebP when supported, otherwise JPEG) and stored directly on the product
// document in Firestore.
const MAX_WIDTH = 600;
const JPEG_QUALITY = 0.65;
// Firestore documents are capped at 1 MiB; keep total base64 payload well under it.
const MAX_TOTAL_BYTES = 850 * 1024;

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve({ img });
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

const compressToDataUrl = async (file, maxWidth = MAX_WIDTH, quality = JPEG_QUALITY) => {
  const { img } = await loadImage(file);
  const scale = Math.min(1, maxWidth / img.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Prefer WebP (smaller than JPEG at the same quality); fall back to JPEG.
  const webp = canvas.toDataURL('image/webp', quality);
  if (webp.startsWith('data:image/webp')) return webp;
  return canvas.toDataURL('image/jpeg', quality);
};

export const uploadProductImage = async (file, onProgress = () => {}) => {
  const dataUrl = await compressToDataUrl(file);
  onProgress?.(100);
  return dataUrl;
};

export const uploadMultipleProductImages = async (files, onProgress = () => {}) => {
  const results = [];
  const total = files.length || 1;
  for (let i = 0; i < files.length; i++) {
    onProgress?.(Math.round((i / total) * 100));
    results.push(await uploadProductImage(files[i]));
    onProgress?.(Math.round(((i + 1) / total) * 100));
  }
  const totalBytes = results.reduce((s, d) => s + Math.ceil((d.length * 3) / 4), 0);
  if (totalBytes > MAX_TOTAL_BYTES) {
    throw new Error('Images are too large. Please use fewer images or smaller files.');
  }
  return results;
};
