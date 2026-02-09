/**
 * Global configuration for the files browser.
 */

// Import RuntimeConfig type for window augmentation
import type { RuntimeConfig as _RuntimeConfig } from "./types"

/**
 * Get the public base URL with runtime override support.
 * Fallback chain (priority order):
 * 1. window.__APP_CONFIG__.publicBaseUrl (runtime - container env var)
 * 2. import.meta.env.VITE_PUBLIC_BASE_URL (build-time - backwards compatible)
 * 3. "https://files.balutoiu.com" (hardcoded default)
 */
function getPublicBaseUrl(): string {
  if (typeof window !== "undefined" && window.__APP_CONFIG__?.publicBaseUrl) {
    return window.__APP_CONFIG__.publicBaseUrl
  }
  if (import.meta.env.VITE_PUBLIC_BASE_URL) {
    return import.meta.env.VITE_PUBLIC_BASE_URL
  }
  return "https://files.balutoiu.com"
}

/**
 * Base URL for publicly shared files.
 * This is used to construct the full public URL when copying share links.
 * Configurable via:
 * - Runtime: PUBLIC_BASE_URL env var at container startup
 * - Build-time: VITE_PUBLIC_BASE_URL env var
 */
export const PUBLIC_BASE_URL = getPublicBaseUrl()

/**
 * Get the full public URL for a shared file.
 * @param filePath - The relative path of the shared file
 * @returns The full public URL
 */
export function getPublicFileUrl(filePath: string): string {
  const normalizedBase = PUBLIC_BASE_URL.replace(/\/+$/, "")
  const normalizedPath = filePath.replace(/^\/+/, "")
  return `${normalizedBase}/${normalizedPath}`
}
