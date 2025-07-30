/**
 * Firebase Storage utilities for avatar uploads
 */

import { storage, db } from '@/lib/firebase/client';
import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

interface UploadResult {
  url: string;
  success: boolean;
  error?: string;
}

/**
 * Upload avatar image and replace old one
 */
export async function uploadAvatar(file: File, userId: string): Promise<UploadResult> {
  try {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { url: '', success: false, error: validation.error };
    }

    // Check if user is authenticated
    const { auth } = await import('@/lib/firebase/client');
    if (!auth.currentUser) {
      return { url: '', success: false, error: 'User not authenticated' };
    }

    // Get current avatar URL to delete old image
    const userDoc = await getDoc(doc(db, 'users', userId));
    const currentAvatarUrl = userDoc.exists() ? userDoc.data().avatarUrl : null;

    // Create storage reference with better path structure
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `avatar_${timestamp}.${fileExtension}`;
    const storageRef = ref(storage, `avatars/${userId}/${fileName}`);

    console.log('Uploading avatar for user:', userId);
    console.log('Storage path:', `avatars/${userId}/${fileName}`);
    console.log('File size:', file.size, 'bytes');
    console.log('File type:', file.type);

    // Upload new image with metadata
    const metadata = {
      contentType: file.type,
      customMetadata: {
        userId: userId,
        uploadedAt: new Date().toISOString()
      }
    };

    const snapshot = await uploadBytes(storageRef, file, metadata);
    console.log('Upload successful, getting download URL...');
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Download URL obtained:', downloadURL);

    // Update user profile with new URL
    await updateDoc(doc(db, 'users', userId), {
      avatarUrl: downloadURL,
      updatedAt: new Date()
    });

    // Delete old image if it exists and is from our storage
    if (currentAvatarUrl && currentAvatarUrl.includes('firebasestorage.googleapis.com')) {
      try {
        await deleteOldAvatar(currentAvatarUrl);
        console.log('Old avatar deleted successfully');
      } catch (error) {
        console.warn('Could not delete old avatar:', error);
        // Don't fail the upload if we can't delete the old image
      }
    }

    return { url: downloadURL, success: true };

  } catch (error: any) {
    console.error('Error uploading avatar:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Upload failed';
    
    if (error.code === 'storage/unauthorized') {
      errorMessage = 'Upload permission denied. Please check your authentication.';
    } else if (error.code === 'storage/canceled') {
      errorMessage = 'Upload was canceled.';
    } else if (error.code === 'storage/unknown') {
      errorMessage = 'An unknown error occurred during upload.';
    } else if (error.code === 'storage/invalid-format') {
      errorMessage = 'Invalid file format.';
    } else if (error.code === 'storage/invalid-event-name') {
      errorMessage = 'Invalid upload configuration.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return { 
      url: '', 
      success: false, 
      error: errorMessage
    };
  }
}

/**
 * Delete old avatar from storage
 */
async function deleteOldAvatar(avatarUrl: string): Promise<void> {
  try {
    // Extract the storage path from the URL
    const url = new URL(avatarUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+?)\?/);
    
    if (pathMatch) {
      const storagePath = decodeURIComponent(pathMatch[1]);
      const oldImageRef = ref(storage, storagePath);
      await deleteObject(oldImageRef);
    }
  } catch (error) {
    console.error('Error deleting old avatar:', error);
    throw error;
  }
}

/**
 * Validate image file
 */
function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: 'Please upload a valid image file (JPEG, PNG, or WebP)' 
    };
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: 'Image must be smaller than 5MB' 
    };
  }

  // Check image dimensions (optional - we'll resize if needed)
  return { valid: true };
}

/**
 * Test Firebase Storage connection
 */
export async function testStorageConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const { auth } = await import('@/lib/firebase/client');
    
    if (!auth.currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    // Try to create a test reference
    const testRef = ref(storage, `test/${auth.currentUser.uid}/connection-test.txt`);
    const testData = new Blob(['test'], { type: 'text/plain' });
    
    // Try to upload a small test file
    await uploadBytes(testRef, testData);
    
    // Try to get download URL
    await getDownloadURL(testRef);
    
    // Clean up test file
    try {
      await deleteObject(testRef);
    } catch (cleanupError) {
      console.warn('Could not clean up test file:', cleanupError);
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Storage connection test failed:', error);
    return { 
      success: false, 
      error: error.code || error.message || 'Storage connection failed' 
    };
  }
}

/**
 * Resize image before upload (optional optimization)
 */
export function resizeImage(file: File, maxWidth: number = 400, maxHeight: number = 400, quality: number = 0.8): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(resizedFile);
          } else {
            resolve(file); // Fallback to original
          }
        },
        file.type,
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
}