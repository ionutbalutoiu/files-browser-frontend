/**
 * File move API.
 * Handles moving files and directories to new locations.
 */

import { buildApiUrl, stripSlashes } from "../url"
import { API_ENDPOINTS } from "../constants"
import { fetchWithTimeout } from "./http"
import type { AppError, MoveResult } from "../types"

/**
 * Move a file or directory to a new location.
 * @param sourcePath - Full path to file or directory to move (e.g., "/photos/image.jpg")
 * @param destPath - Destination path (e.g., "/archive/image.jpg")
 * @returns MoveResult with source, dest, and success status
 */
export async function moveFile(
  sourcePath: string,
  destPath: string,
): Promise<MoveResult> {
  // Normalize paths: remove leading/trailing slashes
  const normalizedSource = stripSlashes(sourcePath)
  const normalizedDest = stripSlashes(destPath)

  // Encode the destination for the query parameter
  const encodedDest = encodeURIComponent(normalizedDest)

  const moveUrl =
    buildApiUrl(API_ENDPOINTS.MV, normalizedSource, false) +
    `?dest=${encodedDest}`

  const response = await fetchWithTimeout(moveUrl, { method: "POST" })

  if (!response.ok) {
    let errorMessage: string

    try {
      const result = await response.json()
      errorMessage = result.error || `Move failed: ${response.status}`
    } catch {
      errorMessage = `Move failed: ${response.status}`
    }

    // Map status codes to user-friendly messages
    switch (response.status) {
      case 404:
        throw { message: "Source file not found", status: 404 } as AppError
      case 409:
        throw {
          message: "A file with that name already exists at destination",
          status: 409,
        } as AppError
      case 400:
        throw { message: "Invalid move operation", status: 400 } as AppError
      case 403:
        throw { message: "Permission denied", status: 403 } as AppError
      default:
        throw { message: errorMessage, status: response.status } as AppError
    }
  }

  const result = await response.json()
  return result as MoveResult
}

/**
 * Build the destination path for a move operation.
 * Combines target directory with the item name.
 * @param targetDir - Destination directory path
 * @param itemName - Name of the item being moved
 * @returns Full destination path
 */
export function buildMovePath(targetDir: string, itemName: string): string {
  const normalizedDir = stripSlashes(targetDir)
  if (normalizedDir) {
    return `${normalizedDir}/${itemName}`
  }
  return itemName
}
