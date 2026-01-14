/**
 * API module barrel export.
 * Re-exports all API functions and types from their respective modules.
 */

// Directory browsing
export {
  fetchDirectory,
  getFileUrl,
  getDirectoryUrl,
} from './directory';

// File upload
export {
  uploadFiles,
  uploadFilesWithProgress,
  validateFiles,
  formatTotalSize,
} from './upload';

// File deletion
export {
  deleteFile,
  getDeletePath,
} from './delete';

// File renaming
export {
  renameFile,
} from './rename';

// Directory creation
export {
  createDirectory,
} from './mkdir';

// File sharing
export {
  sharePublic,
  listSharePublicFiles,
  deletePublicShare,
  type SharePublicFilesError,
} from './share';

// Re-export types for convenience
export type {
  FetchResult,
  FetchError,
  UploadResult,
  UploadError,
  DeleteError,
  RenameError,
  CreateDirectoryResult,
  CreateDirectoryError,
  SharePublicResult,
  SharePublicError,
} from '../types';
