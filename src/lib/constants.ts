/**
 * Application constants.
 * Centralized configuration values to avoid magic numbers.
 */

// =============================================================================
// File Upload Constants
// =============================================================================

/** Maximum file size for uploads (2GB) */
export const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024

/** Human-readable max file size for error messages */
export const MAX_FILE_SIZE_LABEL = "2GB"

// =============================================================================
// API Endpoints
// =============================================================================

export const API_ENDPOINTS = {
  FILES: "/files",
  UPLOAD: "/upload",
  DELETE: "/delete",
  RENAME: "/rename",
  MKDIR: "/mkdir",
  SHARE_PUBLIC: "/share-public",
  SHARE_PUBLIC_FILES: "/share-public-files/",
  SHARE_PUBLIC_DELETE: "/share-public-delete",
} as const

// =============================================================================
// Timing Constants (milliseconds)
// =============================================================================

/** Duration for toast notifications */
export const TOAST_TIMEOUT = 4000

/** Duration for "Copied!" feedback */
export const COPY_FEEDBACK_TIMEOUT = 2000

/** Duration for delete error messages */
export const DELETE_ERROR_TIMEOUT = 5000

/** Timeout for API fetch requests (30 seconds) */
export const FETCH_TIMEOUT = 30000

// =============================================================================
// UI Constants
// =============================================================================

/** Height of context menu (3 items * ~44px) */
export const MENU_HEIGHT = 132

/** Minimum space needed below element before menu opens upward */
export const MENU_PADDING = 8
