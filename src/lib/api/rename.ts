/**
 * File rename API.
 * Handles renaming files and directories.
 */

import { BACKEND_ENDPOINTS } from "../constants"
import { capitalize } from "../format"
import { fetchWithTimeout } from "./http"
import type { AppError, RenameResult } from "../types"

/**
 * Rename a file or directory.
 * @param oldPath - Full path to file or directory (e.g., "/photos/2026/image.jpg")
 * @param newName - New name for the file or directory (just the name, not full path)
 * @returns RenameResult with from, to, and success status
 */
export async function renameFile(
  oldPath: string,
  newName: string,
): Promise<RenameResult> {
  // Normalize path: remove leading/trailing slashes
  const normalizedPath = oldPath.replace(/^\/+|\/+$/g, "")

  // Build rename URL (POST to /files/rename with JSON body)
  const response = await fetchWithTimeout(BACKEND_ENDPOINTS.API_FILES_RENAME, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path: normalizedPath,
      name: newName.trim(),
    }),
  })

  if (!response.ok) {
    let errorMessage: string

    try {
      const result = await response.json()
      errorMessage = result.error || `Rename failed: ${response.status}`
    } catch {
      errorMessage = `Rename failed: ${response.status}`
    }

    // Map status codes to user-friendly messages, using server message when available
    switch (response.status) {
      case 404:
        throw { message: "File not found", status: 404 } as AppError
      case 409:
        throw {
          message: "A file with that name already exists",
          status: 409,
        } as AppError
      case 400:
        throw { message: "Invalid name", status: 400 } as AppError
      default:
        throw {
          message: capitalize(errorMessage),
          status: response.status,
        } as AppError
    }
  }

  const result = await response.json()
  return result as RenameResult
}
