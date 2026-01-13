/**
 * URL utilities for building API endpoints.
 * Handles path normalization to prevent double slashes.
 */

/**
 * Normalize a URL path by collapsing multiple consecutive slashes into single slashes.
 * Preserves protocol slashes (http://, https://) and query strings.
 * 
 * @param url - The URL or path to normalize
 * @returns Normalized URL with single slashes in path portion
 * 
 * @example
 * normalizePath("/upload//") => "/upload/"
 * normalizePath("http://localhost:3000//upload//path") => "http://localhost:3000/upload/path"
 * normalizePath("/upload//?a=1") => "/upload/?a=1"
 */
export function normalizePath(url: string): string {
  if (!url) return url;

  // Split off query string first
  const queryIndex = url.indexOf('?');
  let path = queryIndex >= 0 ? url.slice(0, queryIndex) : url;
  const query = queryIndex >= 0 ? url.slice(queryIndex) : '';

  // Preserve protocol (http://, https://, etc.)
  let protocol = '';
  const protocolMatch = path.match(/^([a-z][a-z0-9+.-]*:\/\/)/i);
  if (protocolMatch) {
    protocol = protocolMatch[1];
    path = path.slice(protocol.length);
  }

  // Collapse multiple slashes into single slashes in the path
  path = path.replace(/\/+/g, '/');

  return protocol + path + query;
}

/**
 * Join URL parts safely, ensuring no double slashes.
 * 
 * @param base - Base URL or path
 * @param parts - Additional path segments to join
 * @returns Joined URL with normalized slashes
 * 
 * @example
 * joinUrl("/upload/", "") => "/upload/"
 * joinUrl("/upload/", "/") => "/upload/"
 * joinUrl("/upload", "/path/") => "/upload/path/"
 * joinUrl("http://localhost:3000", "/upload//") => "http://localhost:3000/upload/"
 */
export function joinUrl(base: string, ...parts: string[]): string {
  // Start with the base
  let result = base;

  for (const part of parts) {
    if (!part) continue;

    // Ensure exactly one slash between parts
    const baseEndsWithSlash = result.endsWith('/');
    const partStartsWithSlash = part.startsWith('/');

    if (baseEndsWithSlash && partStartsWithSlash) {
      // Both have slash - remove one
      result = result + part.slice(1);
    } else if (!baseEndsWithSlash && !partStartsWithSlash) {
      // Neither has slash - add one
      result = result + '/' + part;
    } else {
      // Exactly one has slash - just concatenate
      result = result + part;
    }
  }

  return normalizePath(result);
}

/**
 * Build an API endpoint URL with proper path normalization.
 * Ensures the path portion has no double slashes and handles trailing slashes.
 * 
 * @param endpoint - The API endpoint (e.g., "/upload", "/delete", "/mkdir")
 * @param path - The resource path to append
 * @param trailingSlash - Whether to ensure a trailing slash (default: false)
 * @returns Properly formatted API URL
 * 
 * @example
 * buildApiUrl("/upload", "/", true) => "/upload/"
 * buildApiUrl("/upload", "photos/2026/", true) => "/upload/photos/2026/"
 * buildApiUrl("/delete", "/photos/image.jpg", false) => "/delete/photos/image.jpg"
 */
export function buildApiUrl(
  endpoint: string,
  path: string,
  trailingSlash: boolean = false
): string {
  // Normalize the endpoint (remove trailing slash for consistent joining)
  // Add /api prefix to all API endpoints
  const normalizedEndpoint = '/api' + endpoint.replace(/\/+$/, '');
  
  // Normalize the path (remove leading slashes to prevent doubles)
  let normalizedPath = path.replace(/^\/+/, '');
  
  // Handle trailing slash requirement
  if (trailingSlash) {
    normalizedPath = normalizedPath.replace(/\/*$/, '/');
  }
  
  // If path is empty or just became "/" from empty, handle appropriately
  if (!normalizedPath || normalizedPath === '/') {
    return trailingSlash ? `${normalizedEndpoint}/` : normalizedEndpoint;
  }

  return normalizePath(`${normalizedEndpoint}/${normalizedPath}`);
}
