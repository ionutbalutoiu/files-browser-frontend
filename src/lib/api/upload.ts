/**
 * File upload API.
 * Handles uploading files with optional progress tracking.
 */

import { buildApiUrl } from '../url';
import { API_ENDPOINTS, MAX_FILE_SIZE, MAX_FILE_SIZE_LABEL } from '../constants';
import type { UploadResult, UploadError } from '../types';

/**
 * Upload files to the server.
 * @param files - Files to upload
 * @param targetPath - Target directory path (e.g., "/photos/2026/")
 */
export async function uploadFiles(
  files: FileList | File[],
  targetPath: string
): Promise<UploadResult> {
  const formData = new FormData();

  for (const file of files) {
    formData.append('files', file);
  }

  // Build upload URL with proper path normalization
  const uploadUrl = buildApiUrl(API_ENDPOINTS.UPLOAD, targetPath, true);

  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
    // Don't set Content-Type - browser sets it with boundary
  });

  let result: UploadResult | { error: string };
  try {
    result = await response.json();
  } catch {
    throw { message: 'Invalid server response' } as UploadError;
  }

  if ('error' in result) {
    throw { message: result.error } as UploadError;
  }

  if (!response.ok && !result.uploaded?.length) {
    throw { message: `Upload failed: ${response.status}` } as UploadError;
  }

  return result;
}

/**
 * Upload files with progress tracking.
 * @param files - Files to upload
 * @param targetPath - Target directory path
 * @param onProgress - Progress callback (0-100)
 */
export function uploadFilesWithProgress(
  files: FileList | File[],
  targetPath: string,
  onProgress: (percent: number) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }

    // Build upload URL with proper path normalization
    const uploadUrl = buildApiUrl(API_ENDPOINTS.UPLOAD, targetPath, true);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      try {
        const result = JSON.parse(xhr.responseText);
        if ('error' in result && !result.uploaded?.length) {
          reject({ message: result.error } as UploadError);
        } else if (xhr.status >= 200 && xhr.status < 300) {
          resolve(result);
        } else if (result.uploaded?.length) {
          // Partial success
          resolve(result);
        } else {
          reject({ message: `Upload failed: ${xhr.status}` } as UploadError);
        }
      } catch {
        reject({ message: 'Invalid server response' } as UploadError);
      }
    });

    xhr.addEventListener('error', () => {
      reject({ message: 'Network error' } as UploadError);
    });

    xhr.addEventListener('abort', () => {
      reject({ message: 'Upload cancelled' } as UploadError);
    });

    xhr.open('POST', uploadUrl);
    xhr.send(formData);
  });
}

/**
 * Validate files before upload (client-side).
 */
export function validateFiles(files: FileList | File[]): string[] {
  const errors: string[] = [];

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${file.name}: exceeds ${MAX_FILE_SIZE_LABEL} limit`);
    }
    if (file.name.startsWith('.')) {
      errors.push(`${file.name}: hidden files not allowed`);
    }
  }

  return errors;
}

/**
 * Format total size of files for display.
 */
export function formatTotalSize(files: FileList | File[]): string {
  const total = Array.from(files).reduce((sum, f) => sum + f.size, 0);

  if (total === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(
    Math.floor(Math.log(total) / Math.log(1024)),
    units.length - 1
  );

  const size = total / Math.pow(1024, exponent);
  const formatted = exponent === 0 ? size.toString() : size.toFixed(1);

  return `${formatted} ${units[exponent]}`;
}
