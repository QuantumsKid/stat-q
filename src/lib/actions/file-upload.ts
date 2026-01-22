'use server';

import { createClient } from '@/utils/supabase/server';
import type { UploadedFile } from '@/lib/types/response.types';
import { v4 as uuidv4 } from 'uuid';

export async function uploadFileAction(
  file: File,
  formId: string,
  questionId: string
): Promise<UploadedFile> {
  const supabase = await createClient();

  const fileExtension = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExtension}`;
  const filePath = `${formId}/${questionId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('form_files') // Assuming a bucket named 'form_files'
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`File upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from('form_files')
    .getPublicUrl(filePath);

  if (!publicUrlData.publicUrl) {
    throw new Error('Failed to get public URL for uploaded file.');
  }

  const uploadedFile: UploadedFile = {
    id: uuidv4(), // Generate a new ID for the uploaded file record
    name: file.name,
    size: file.size,
    type: file.type,
    url: publicUrlData.publicUrl,
    uploadedAt: new Date().toISOString(),
  };

  return uploadedFile;
}

export async function deleteFileAction(filePath: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.storage.from('form_files').remove([filePath]);

  if (error) {
    throw new Error(`File deletion failed: ${error.message}`);
  }
}
