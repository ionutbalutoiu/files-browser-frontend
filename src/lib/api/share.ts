/**
 * File sharing API.
 * Handles public file sharing operations.
 */

import { buildApiUrl } from '../url';
import type { SharePublicResult, SharePublicError } from '../types';

/**
 * Error response from share-public-files endpoint.
 */
export interface SharePublicFilesError {
  message: string;
  notEnabled?: boolean;
}

/**
 * Share a file publicly.
 * @param path - Full path to the file (e.g., "photos/2026/image.jpg")
 * @returns The relative path of the shared file
 */
export async function sharePublic(path: string): Promise<SharePublicResult> {
  // Normalize path: remove leading/trailing slashes
  const normalizedPath = path.replace(/^\/+|\/+$/g, '');

  if (!normalizedPath) {
    throw { message: 'Invalid path' } as SharePublicError;
  }

  const shareUrl = buildApiUrl('/share-public', normalizedPath, false);

  const response = await fetch(shareUrl, {
    method: 'POST',
  });

  let result: SharePublicResult | { error: string };
  try {
    result = await response.json();
  } catch {
    if (response.ok) {
      return { shared: normalizedPath };
    }
    throw { message: `Share failed: ${response.status}` } as SharePublicError;
  }

  if (!response.ok) {
    const errorMessage = 'error' in result ? result.error : `Share failed: ${response.status}`;

    // Map status codes to user-friendly messages
    switch (response.status) {
      case 400:
        throw { message: errorMessage, status: 400 } as SharePublicError;
      case 404:
        throw { message: 'File not found', status: 404 } as SharePublicError;
      case 409:
        // Conflict means already shared - return success for better UX
        return { shared: normalizedPath };
      case 501:
        throw { message: 'Public sharing is not enabled on this server', status: 501 } as SharePublicError;
      default:
        throw { message: errorMessage, status: response.status } as SharePublicError;
    }
  }

  return result as SharePublicResult;
}

/**
 * List all publicly shared files.
 * Returns an array of relative file paths.
 */
export async function listSharePublicFiles(): Promise<string[]> {
  const url = buildApiUrl('/share-public-files/', '', true);

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 501) {
      const data = await response.json().catch(() => ({}));
      const error: SharePublicFilesError = {
        message: data.error || 'Public sharing is not enabled on this server',
        notEnabled: true,
      };
      throw error;
    }
    const error: SharePublicFilesError = {
      message: `Server error: ${response.status}`,
    };
    throw error;
  }

  try {
    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Invalid response format');
    }
    return data as string[];
  } catch {
    throw { message: 'Failed to parse response' } as SharePublicFilesError;
  }
}

/**
 * Delete a public share.
 * @param path - The relative path of the file to unlink
 */
export async function deletePublicShare(path: string): Promise<{ deleted: string }> {
  const url = buildApiUrl('/share-public-delete', '', false);

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw { message: data.error || `Failed to delete share: ${response.status}` } as SharePublicFilesError;
  }

  return response.json();
}
