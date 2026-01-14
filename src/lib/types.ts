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
  name: string;
  type: 'file' | 'directory';
  size?: number;   // Only present for files
  mtime?: string;  // ISO 8601 format datetime
}

export type NginxAutoindexResponse = NginxEntry[];

// =============================================================================
// Sort & Filter Types
// =============================================================================

export type SortField = 'name' | 'size' | 'mtime';
export type SortDirection = 'asc' | 'desc';

export interface SortState {
  field: SortField;
  direction: SortDirection;
}

export interface FilterState {
  search: string;
}

// =============================================================================
// Router Types
// =============================================================================

export type RouteType = 'files' | 'shared';

export interface RouteInfo {
  type: RouteType;
  path: string;
}

export type RouteChangeCallback = (path: string) => void;

export interface BreadcrumbSegment {
  name: string;
  path: string;
}

// =============================================================================
// API Response Types
// =============================================================================

export interface FetchResult {
  entries: NginxEntry[];
  path: string;
}

export interface FetchError {
  message: string;
  status?: number;
}

// =============================================================================
// Upload Types
// =============================================================================

export interface UploadResult {
  uploaded: string[];
  skipped: string[];
  errors?: string[];
}

export interface UploadError {
  message: string;
}

// =============================================================================
// Delete Types
// =============================================================================

export interface DeleteError {
  message: string;
  status?: number;
}

// =============================================================================
// Rename Types
// =============================================================================

export interface RenameError {
  message: string;
  status?: number;
}

// =============================================================================
// Directory Creation Types
// =============================================================================

export interface CreateDirectoryResult {
  created: string;
}

export interface CreateDirectoryError {
  message: string;
  status?: number;
}
