/**
 * File rename API.
 * Handles renaming files and directories.
 */

import { buildApiUrl } from '../url';
import { API_ENDPOINTS } from '../constants';
import type { RenameError } from '../types';

/**
 * Rename a file or directory.
 * @param oldPath - Full path to file or directory (e.g., "/photos/2026/image.jpg")
 * @param newName - New name for the file or directory (just the name, not full path)
 */
export async function renameFile(oldPath: string, newName: string): Promise<void> {
  // Normalize path: remove leading/trailing slashes
  const normalizedPath = oldPath.replace(/^\/+|\/+$/g, '');

  // Encode the new name for the query parameter
  const encodedNewName = encodeURIComponent(newName.trim());

  const renameUrl = buildApiUrl(API_ENDPOINTS.RENAME, normalizedPath, true) + `?newName=${encodedNewName}`;
  const response = await fetch(renameUrl, { method: 'POST' });

  if (!response.ok) {
    let errorMessage: string;

    try {
      const result = await response.json();
      errorMessage = result.error || `Rename failed: ${response.status}`;
    } catch {
      errorMessage = `Rename failed: ${response.status}`;
    }

    // Map status codes to user-friendly messages
    switch (response.status) {
      case 404:
        throw { message: 'File not found', status: 404 } as RenameError;
      case 409:
        throw { message: 'A file with that name already exists', status: 409 } as RenameError;
      case 400:
        throw { message: 'Invalid name', status: 400 } as RenameError;
      case 403:
        throw { message: 'Cannot rename this path', status: 403 } as RenameError;
      default:
        throw { message: errorMessage, status: response.status } as RenameError;
    }
  }
}
