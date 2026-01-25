/**
 * API module barrel export.
 * Re-exports all API functions and types from their respective modules.
 */

// HTTP utilities
export { fetchWithTimeout } from "./http"

// Directory browsing
export { fetchDirectory, getFileUrl, getDirectoryUrl } from "./directory"

// File upload
export {
  uploadFiles,
  uploadFilesWithProgress,
  validateFiles,
  formatTotalSize,
} from "./upload"

// File deletion
export { deleteFile, getDeletePath } from "./delete"

// File renaming
export { renameFile } from "./rename"

// File moving
export { moveFile, buildMovePath } from "./move"

// Directory creation
export { createDirectory } from "./mkdir"

// File sharing
export { listSharePublicFiles, sharePublic, deletePublicShare } from "./share"

// Re-export types for convenience
export type {
  AppError,
  FetchResult,
  UploadResult,
  CreateDirectoryResult,
  SharePublicResult,
  MoveResult,
  RenameResult,
} from "../types"
