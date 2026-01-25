/**
 * File deletion API.
 * Handles deleting files and empty directories.
 */

import { stripSlashes } from "../url"
import { BACKEND_ENDPOINTS } from "../constants"
import { fetchWithTimeout } from "./http"
import type { AppError } from "../types"

/**
 * Delete a file or empty directory.
 * @param path - Full path to file or directory (e.g., "/photos/2026/image.jpg")
 */
export async function deleteFile(path: string): Promise<void> {
  // Build delete URL with path as query parameter
  const normalizedPath = stripSlashes(path)
  const deleteUrl =
    BACKEND_ENDPOINTS.API_FILES + `?path=${encodeURIComponent(normalizedPath)}`

  const response = await fetchWithTimeout(deleteUrl, {
    method: "DELETE",
  })

  if (!response.ok) {
    let errorMessage: string

    try {
      const result = await response.json()
      errorMessage = result.error || `Delete failed: ${response.status}`
    } catch {
      errorMessage = `Delete failed: ${response.status}`
    }

    // Map status codes to user-friendly messages
    switch (response.status) {
      case 404:
        throw { message: "File not found", status: 404 } as AppError
      case 409:
        throw { message: "Directory is not empty", status: 409 } as AppError
      case 403:
        throw { message: "Cannot delete this path", status: 403 } as AppError
      default:
        throw { message: errorMessage, status: response.status } as AppError
    }
  }
}

/**
 * Build full path for deletion from directory path and file name.
 */
export function getDeletePath(directoryPath: string, fileName: string): string {
  const normalizedDir = stripSlashes(directoryPath)
  if (normalizedDir) {
    return `${normalizedDir}/${fileName}`
  }
  return fileName
}
