'use client';

import imageCompression from 'browser-image-compression';

const MAX_SIZE_MB = 1;

/**
 * Compresses an image file if it's larger than MAX_SIZE_MB.
 * @param file The image file to compress.
 * @returns A promise that resolves with the compressed file.
 */
export async function compressImage(file: File): Promise<File> {
  // Check if the file is an image
  if (!file.type.startsWith('image/')) {
    console.warn('File is not an image, skipping compression:', file.name);
    return file;
  }
  
  // Check if compression is needed
  if (file.size <= MAX_SIZE_MB * 1024 * 1024) {
    return file;
  }

  const options = {
    maxSizeMB: MAX_SIZE_MB,
    maxWidthOrHeight: 1920, // A reasonable default for web images
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed. Returning original file.', error);
    // Fallback to original file if compression fails
    return file;
  }
}
