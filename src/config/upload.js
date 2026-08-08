import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage, PROJECT_PATH } from './firebase';

const STORAGE_PATH = `${PROJECT_PATH}/product-images`;

export const uploadProductImage = async (file, onProgress = () => {}) => {
  return new Promise((resolve, reject) => {
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `${STORAGE_PATH}/${fileName}`);
    
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress(progress);
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

export const uploadMultipleProductImages = async (files, onProgress = () => {}) => {
  const uploadPromises = files.map((file, index) => {
    return uploadProductImage(file, (progress) => {
      onProgress(Math.round(((index + progress / 100) / files.length) * 100));
    });
  });

  return Promise.all(uploadPromises);
};
