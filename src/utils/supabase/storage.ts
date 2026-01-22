/**
 * Supabase Storage utilities for file uploads
 * Handles file upload, deletion, and retrieval from Supabase Storage
 */

import { createClient as createServerClient } from './server';
import { createClient as createBrowserClient } from './client';

export const STORAGE_BUCKET = 'form-responses';

/**
 * Upload a file to Supabase Storage
 * @param file - File to upload
 * @param userId - User ID of the uploader
 * @param formId - Form ID
 * @param responseId - Response ID
 * @returns Object with file path, public URL, and file metadata
 */
export async function uploadFile(
  file: File,
  userId: string,
  formId: string,
  responseId: string
): Promise<{ path: string; url: string; name: string; size: number; type: string }> {
  const supabase = await createServerClient();

  // Generate unique file path
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `${userId}/${formId}/${responseId}/${timestamp}-${sanitizedFileName}`;

  // Upload file
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(data.path);

  return {
    path: data.path,
    url: urlData.publicUrl,
    name: file.name,
    size: file.size,
    type: file.type,
  };
}

/**
 * Upload multiple files to Supabase Storage
 * @param files - Array of files to upload
 * @param userId - User ID of the uploader
 * @param formId - Form ID
 * @param responseId - Response ID
 * @returns Array of uploaded file metadata
 */
export async function uploadFiles(
  files: File[],
  userId: string,
  formId: string,
  responseId: string
): Promise<Array<{ path: string; url: string; name: string; size: number; type: string }>> {
  const uploadPromises = files.map((file) =>
    uploadFile(file, userId, formId, responseId)
  );

  return Promise.all(uploadPromises);
}

/**
 * Delete a file from Supabase Storage
 * @param filePath - Path to the file in storage
 */
export async function deleteFile(filePath: string): Promise<void> {
  const supabase = await createServerClient();

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([filePath]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Delete multiple files from Supabase Storage
 * @param filePaths - Array of file paths to delete
 */
export async function deleteFiles(filePaths: string[]): Promise<void> {
  const supabase = await createServerClient();

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove(filePaths);

  if (error) {
    throw new Error(`Failed to delete files: ${error.message}`);
  }
}

/**
 * Get download URL for a file
 * @param filePath - Path to the file in storage
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Signed URL for file download
 */
export async function getFileDownloadUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<string> {
  const supabase = await createServerClient();

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    throw new Error(`Failed to get download URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Client-side file upload utility
 * @param file - File to upload
 * @param userId - User ID of the uploader
 * @param formId - Form ID
 * @param responseId - Response ID
 * @returns Object with file path, public URL, and file metadata
 */
export async function uploadFileClient(
  file: File,
  userId: string,
  formId: string,
  responseId: string
): Promise<{ path: string; url: string; name: string; size: number; type: string }> {
  const supabase = createBrowserClient();

  // Generate unique file path
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `${userId}/${formId}/${responseId}/${timestamp}-${sanitizedFileName}`;

  // Upload file
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(data.path);

  return {
    path: data.path,
    url: urlData.publicUrl,
    name: file.name,
    size: file.size,
    type: file.type,
  };
}

/**
 * Validate file size
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in MB
 * @returns true if valid, throws error if invalid
 */
export function validateFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error(
      `File "${file.name}" exceeds maximum size of ${maxSizeMB}MB`
    );
  }
  return true;
}

/**
 * Validate file type
 * @param file - File to validate
 * @param allowedTypes - Array of allowed MIME types or extensions
 * @returns true if valid, throws error if invalid
 */
export function validateFileType(
  file: File,
  allowedTypes: string[]
): boolean {
  if (allowedTypes.length === 0) return true;

  // Check MIME type
  const mimeTypeMatches = allowedTypes.some((type) => {
    if (type.includes('*')) {
      // Handle wildcard types like 'image/*'
      const baseType = type.split('/')[0];
      return file.type.startsWith(baseType + '/');
    }
    return file.type === type;
  });

  if (mimeTypeMatches) return true;

  // Check extension
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  const extensionMatches = allowedTypes.some(
    (type) => type.toLowerCase() === fileExtension
  );

  if (!extensionMatches) {
    throw new Error(
      `File "${file.name}" has invalid type. Allowed types: ${allowedTypes.join(', ')}`
    );
  }

  return true;
}

/**
 * Validate multiple files
 * @param files - Array of files to validate
 * @param maxFiles - Maximum number of files allowed
 * @param maxSizeMB - Maximum size per file in MB
 * @param allowedTypes - Array of allowed MIME types or extensions
 * @returns true if all valid, throws error if invalid
 */
export function validateFiles(
  files: File[],
  maxFiles: number,
  maxSizeMB: number,
  allowedTypes: string[]
): boolean {
  if (files.length > maxFiles) {
    throw new Error(
      `Too many files. Maximum allowed: ${maxFiles}, selected: ${files.length}`
    );
  }

  files.forEach((file) => {
    validateFileSize(file, maxSizeMB);
    validateFileType(file, allowedTypes);
  });

  return true;
}
