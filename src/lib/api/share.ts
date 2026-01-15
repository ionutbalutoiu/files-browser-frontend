/**
 * File sharing API.
 * Handles public file sharing operations.
 */

import { buildApiUrl, stripSlashes } from "../url"
import { API_ENDPOINTS } from "../constants"
import { fetchWithTimeout } from "./http"
import type { SharePublicResult, AppError } from "../types"

/**
 * Share a file publicly.
 * @param path - Full path to the file (e.g., "photos/2026/image.jpg")
 * @returns The relative path of the shared file
 */
export async function sharePublic(path: string): Promise<SharePublicResult> {
  // Normalize path: remove leading/trailing slashes
  const normalizedPath = stripSlashes(path)

  if (!normalizedPath) {
    throw { message: "Invalid path" } as AppError
  }

  const shareUrl = buildApiUrl(
    API_ENDPOINTS.SHARE_PUBLIC,
    normalizedPath,
    false,
  )

  const response = await fetchWithTimeout(shareUrl, {
    method: "POST",
  })

  let result: SharePublicResult | { error: string }
  try {
    result = await response.json()
  } catch {
    if (response.ok) {
      return { shared: normalizedPath }
    }
    throw { message: `Share failed: ${response.status}` } as AppError
  }

  if (!response.ok) {
    const errorMessage =
      "error" in result ? result.error : `Share failed: ${response.status}`

    // Map status codes to user-friendly messages
    switch (response.status) {
      case 400:
        throw { message: errorMessage, status: 400 } as AppError
      case 404:
        throw { message: "File not found", status: 404 } as AppError
      case 409:
        // Conflict means already shared - return success for better UX
        return { shared: normalizedPath }
      case 501:
        throw {
          message: "Public sharing is not enabled on this server",
          status: 501,
        } as AppError
      default:
        throw { message: errorMessage, status: response.status } as AppError
    }
  }

  return result as SharePublicResult
}

/**
 * List all publicly shared files.
 * Returns an array of relative file paths.
 */
export async function listSharePublicFiles(): Promise<string[]> {
  const url = buildApiUrl(API_ENDPOINTS.SHARE_PUBLIC_FILES, "", true)

  const response = await fetchWithTimeout(url, {
    headers: {
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    if (response.status === 501) {
      const data = await response.json().catch((err) => {
        console.warn("Failed to parse 501 response:", err)
        return {}
      })
      const error: AppError = {
        message: data.error || "Public sharing is not enabled on this server",
        notEnabled: true,
      }
      throw error
    }
    const error: AppError = {
      message: `Server error: ${response.status}`,
    }
    throw error
  }

  try {
    const data = await response.json()
    if (!Array.isArray(data)) {
      throw new Error("Invalid response format")
    }
    return data as string[]
  } catch {
    throw { message: "Failed to parse response" } as AppError
  }
}

/**
 * Delete a public share.
 * @param path - The relative path of the file to unlink
 */
export async function deletePublicShare(
  path: string,
): Promise<{ deleted: string }> {
  const url = buildApiUrl(API_ENDPOINTS.SHARE_PUBLIC_DELETE, "", false)

  const response = await fetchWithTimeout(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path }),
  })

  if (!response.ok) {
    const data = await response.json().catch((err) => {
      console.warn("Failed to parse error response:", err)
      return {}
    })
    throw {
      message: data.error || `Failed to delete share: ${response.status}`,
    } as AppError
  }

  return response.json()
}
