/**
 * File deletion API.
 * Handles deleting files and empty directories.
 */

import { buildApiUrl } from '../url';
import { API_ENDPOINTS } from '../constants';
import type { DeleteError } from '../types';

/**
 * Delete a file or empty directory.
 * @param path - Full path to file or directory (e.g., "/photos/2026/image.jpg")
 */
export async function deleteFile(path: string): Promise<void> {
  // Build delete URL with proper path normalization
  const deleteUrl = buildApiUrl(API_ENDPOINTS.DELETE, path, false);

  const response = await fetch(deleteUrl, {
    method: 'DELETE',
  });

  if (!response.ok) {
    let errorMessage: string;

    try {
      const result = await response.json();
      errorMessage = result.error || `Delete failed: ${response.status}`;
    } catch {
      errorMessage = `Delete failed: ${response.status}`;
    }

    // Map status codes to user-friendly messages
    switch (response.status) {
      case 404:
        throw { message: 'File not found', status: 404 } as DeleteError;
      case 409:
        throw { message: 'Directory is not empty', status: 409 } as DeleteError;
      case 403:
        throw { message: 'Cannot delete this path', status: 403 } as DeleteError;
      default:
        throw { message: errorMessage, status: response.status } as DeleteError;
    }
  }
}

/**
 * Build full path for deletion from directory path and file name.
 */
export function getDeletePath(directoryPath: string, fileName: string): string {
  const normalizedDir = directoryPath.replace(/^\/+|\/+$/g, '');
  if (normalizedDir) {
    return `${normalizedDir}/${fileName}`;
  }
  return fileName;
}
