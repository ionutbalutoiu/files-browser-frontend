import { parseNginxResponse } from './nginxAutoindex';
import { buildApiUrl } from './url';
import type { FetchResult, FetchError } from './types';

// Re-export types for backwards compatibility
export type { FetchResult, FetchError } from './types';

/**
 * Fetch directory listing from nginx autoindex.
 * Path should already be properly formatted (with trailing slash).
 */
export async function fetchDirectory(path: string): Promise<FetchResult> {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Build the fetch URL with proper normalization
  const url = buildApiUrl('/files', normalizedPath, true);

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const error: FetchError = {
      message: response.status === 404 
        ? 'Directory not found' 
        : `Server error: ${response.status}`,
      status: response.status,
    };
    throw error;
  }

  // Check content type
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw { message: 'Invalid response: expected JSON' } as FetchError;
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw { message: 'Failed to parse JSON response' } as FetchError;
  }

  try {
    const entries = parseNginxResponse(data);
    return { entries, path: normalizedPath };
  } catch (e) {
    throw { 
      message: e instanceof Error ? e.message : 'Failed to parse directory listing' 
    } as FetchError;
  }
}

/**
 * Build the full URL for a file download/open.
 */
export function getFileUrl(directoryPath: string, fileName: string): string {
  const normalizedDir = directoryPath.startsWith('/') ? directoryPath : `/${directoryPath}`;
  const encodedName = encodeURIComponent(fileName);
  return buildApiUrl('/files', `${normalizedDir}${encodedName}`, false);
}

/**
 * Build the full URL for navigating to a subdirectory.
 */
export function getDirectoryUrl(directoryPath: string, dirName: string): string {
  const normalizedDir = directoryPath.startsWith('/') ? directoryPath : `/${directoryPath}`;
  const encodedName = encodeURIComponent(dirName);
  return `${normalizedDir}${encodedName}/`;
}

/**
 * Error response from share-public-files endpoint
 */
export interface SharePublicFilesError {
  message: string;
  notEnabled?: boolean;
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
