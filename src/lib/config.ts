/**
 * Global configuration for the files browser.
 */

/**
 * Base URL for publicly shared files.
 * This is used to construct the full public URL when copying share links.
 */
export const PUBLIC_BASE_URL = 'https://files.balutoiu.com';

/**
 * Get the full public URL for a shared file.
 * @param filePath - The relative path of the shared file
 * @returns The full public URL
 */
export function getPublicFileUrl(filePath: string): string {
  // Ensure path starts with /
  const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  return `${PUBLIC_BASE_URL}${normalizedPath}`;
}
