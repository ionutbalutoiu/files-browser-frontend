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

/** Parallel upload concurrency */
export const DEFAULT_UPLOAD_CONCURRENCY = 2

/** Retry count for transient upload failures */
export const DEFAULT_UPLOAD_MAX_RETRIES = 2

/** Base delay for retry backoff (milliseconds) */
export const DEFAULT_UPLOAD_RETRY_BASE_DELAY_MS = 300

// =============================================================================
// API Endpoints
// =============================================================================

export const BACKEND_ENDPOINTS = {
  /** GET /files/{path} - directory listing */
  FILES: "/files",

  /** PUT/DELETE /api/files - file upload,delete */
  API_FILES: "/api/files",

  /** POST /api/files/move - move file/folder */
  API_FILES_MOVE: "/api/files/move",

  /** POST /api/files/rename - rename file/folder */
  API_FILES_RENAME: "/api/files/rename",

  /** POST /api/folders - create folder */
  API_FOLDERS: "/api/folders",

  /** GET/POST/DELETE /api/public-shares - public sharing */
  API_PUBLIC_SHARES: "/api/public-shares",
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
