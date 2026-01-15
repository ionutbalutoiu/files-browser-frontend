/**
 * Centralized type definitions for the Files Browser application.
 */

// =============================================================================
// Data Model Types
// =============================================================================

/**
 * Entry from Nginx autoindex JSON response.
 * Fields are based on nginx autoindex_format json output.
 */
export interface NginxEntry {
  name: string
  type: "file" | "directory"
  size?: number // Only present for files
  mtime?: string // ISO 8601 format datetime
}

export type NginxAutoindexResponse = NginxEntry[]

// =============================================================================
// Sort & Filter Types
// =============================================================================

export type SortField = "name" | "size" | "mtime"
export type SortDirection = "asc" | "desc"

export interface SortState {
  field: SortField
  direction: SortDirection
}

export interface FilterState {
  search: string
}

// =============================================================================
// Router Types
// =============================================================================

export type RouteType = "files" | "shared"

export interface RouteInfo {
  type: RouteType
  path: string
}

export type RouteChangeCallback = (path: string) => void

export interface BreadcrumbSegment {
  name: string
  path: string
}

// =============================================================================
// Common Error Type
// =============================================================================

/**
 * Unified error type for all API operations.
 * Use this instead of operation-specific error types.
 */
export interface AppError {
  message: string
  status?: number
  code?: string // machine-readable error code
  cause?: unknown // original error for debugging
  notEnabled?: boolean // feature not enabled on server
}

// =============================================================================
// API Response Types
// =============================================================================

export interface FetchResult {
  entries: NginxEntry[]
  path: string
}

// =============================================================================
// Upload Types
// =============================================================================

export interface UploadResult {
  uploaded: string[]
  skipped: string[]
  errors?: string[]
}

// =============================================================================
// Directory Creation Types
// =============================================================================

export interface CreateDirectoryResult {
  created: string
}

// =============================================================================
// Share Types
// =============================================================================

export interface SharePublicResult {
  shared: string
}
