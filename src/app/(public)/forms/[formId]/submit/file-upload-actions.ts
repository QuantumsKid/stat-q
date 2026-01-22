'use server';

/**
 * Server actions for file upload handling
 * Used by the form submission process
 */

import { uploadFile, uploadFiles, validateFiles } from '@/utils/supabase/storage';
import { nanoid } from 'nanoid';

export interface UploadedFileMetadata {
  id: string;
  path: string;
  url: string;
  name: string;
  size: number;
  type: string;
}

/**
 * Upload a single file for a form response
 * @param formData - FormData containing the file
 * @param userId - User ID (or anonymous ID)
 * @param formId - Form ID
 * @param responseId - Response ID
 * @param maxSizeMB - Maximum file size in MB
 * @param allowedTypes - Allowed file types
 * @returns Uploaded file metadata
 */
export async function uploadResponseFile(
  formData: FormData,
  userId: string,
  formId: string,
  responseId: string,
  maxSizeMB: number = 10,
  allowedTypes: string[] = []
): Promise<UploadedFileMetadata> {
  const file = formData.get('file') as File;

  if (!file) {
    throw new Error('No file provided');
  }

  try {
    // Validate file
    validateFiles([file], 1, maxSizeMB, allowedTypes);

    // Upload to Supabase Storage
    const uploadedFile = await uploadFile(file, userId, formId, responseId);

    return {
      id: nanoid(),
      ...uploadedFile,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`File upload failed: ${error.message}`);
    }
    throw new Error('File upload failed');
  }
}

/**
 * Upload multiple files for a form response
 * @param formData - FormData containing the files
 * @param userId - User ID (or anonymous ID)
 * @param formId - Form ID
 * @param responseId - Response ID
 * @param maxFiles - Maximum number of files
 * @param maxSizeMB - Maximum file size in MB
 * @param allowedTypes - Allowed file types
 * @returns Array of uploaded file metadata
 */
export async function uploadResponseFiles(
  formData: FormData,
  userId: string,
  formId: string,
  responseId: string,
  maxFiles: number = 5,
  maxSizeMB: number = 10,
  allowedTypes: string[] = []
): Promise<UploadedFileMetadata[]> {
  const files: File[] = [];

  // Extract all files from FormData
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('file-') && value instanceof File) {
      files.push(value);
    }
  }

  if (files.length === 0) {
    throw new Error('No files provided');
  }

  try {
    // Validate all files
    validateFiles(files, maxFiles, maxSizeMB, allowedTypes);

    // Upload all files
    const uploadedFiles = await uploadFiles(files, userId, formId, responseId);

    return uploadedFiles.map((file) => ({
      id: nanoid(),
      ...file,
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`File upload failed: ${error.message}`);
    }
    throw new Error('File upload failed');
  }
}

/**
 * Generate a temporary user ID for anonymous file uploads
 * @returns Anonymous user ID
 */
export function generateAnonymousUserId(): string {
  return `anon_${nanoid()}`;
}
