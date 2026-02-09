/**
 * Directory creation API.
 * Handles creating new directories.
 */

import { stripSlashes } from "../url"
import { BACKEND_ENDPOINTS } from "../constants"
import { validateFolderName } from "../validators"
import { fetchWithTimeout } from "./http"
import type { CreateDirectoryResult, AppError } from "../types"

/**
 * Create a new directory.
 * @param parentPath - Parent directory path (e.g., "/photos/2026")
 * @param dirName - Name of the new directory
 */
export async function createDirectory(
  parentPath: string,
  dirName: string,
): Promise<CreateDirectoryResult> {
  // Validate directory name client-side
  const validationError = validateFolderName(dirName)
  if (validationError) {
    throw { message: validationError } as AppError
  }

  // Build the full path
  const normalizedParent = stripSlashes(parentPath)
  const fullPath = normalizedParent ? `${normalizedParent}/${dirName}` : dirName

  // Build mkdir URL (POST to /folders with JSON body)
  const response = await fetchWithTimeout(BACKEND_ENDPOINTS.API_FOLDERS, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path: fullPath }),
  })

  let result: CreateDirectoryResult | { error: string }
  try {
    result = await response.json()
  } catch {
    if (response.ok) {
      return { created: fullPath }
    }
    throw {
      message: `Create directory failed: ${response.status}`,
    } as AppError
  }

  if (!response.ok) {
    const errorMessage =
      "error" in result
        ? result.error
        : `Create directory failed: ${response.status}`

    // Map status codes to user-friendly messages
    switch (response.status) {
      case 404:
        throw {
          message: "Parent directory does not exist",
          status: 404,
        } as AppError
      case 409:
        throw {
          message: "Directory already exists",
          status: 409,
        } as AppError
      case 403:
        throw {
          message: "Cannot create directory here",
          status: 403,
        } as AppError
      case 400:
        throw {
          message: "Invalid directory name",
          status: 400,
        } as AppError
      default:
        throw {
          message: errorMessage,
          status: response.status,
        } as AppError
    }
  }

  return result as CreateDirectoryResult
}
