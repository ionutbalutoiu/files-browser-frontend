import { parseNginxResponse, type NginxEntry } from './nginxAutoindex';

export interface FetchResult {
  entries: NginxEntry[];
  path: string;
}

export interface FetchError {
  message: string;
  status?: number;
}

/**
 * Fetch directory listing from nginx autoindex.
 * Path should already be properly formatted (with trailing slash).
 */
export async function fetchDirectory(path: string): Promise<FetchResult> {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Build the fetch URL
  const url = `/files${normalizedPath}`;

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
  return `/files${normalizedDir}${encodedName}`;
}

/**
 * Build the full URL for navigating to a subdirectory.
 */
export function getDirectoryUrl(directoryPath: string, dirName: string): string {
  const normalizedDir = directoryPath.startsWith('/') ? directoryPath : `/${directoryPath}`;
  const encodedName = encodeURIComponent(dirName);
  return `${normalizedDir}${encodedName}/`;
}
