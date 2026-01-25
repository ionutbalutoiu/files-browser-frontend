/**
 * File sharing API.
 * Handles public file sharing operations.
 */

import { BACKEND_ENDPOINTS } from "../constants"
import { fetchWithTimeout } from "./http"
import type { SharePublicResult, AppError } from "../types"

/**
 * List all publicly shared files.
 * @returns Array of relative file paths, sorted alphabetically
 */
export async function listSharePublicFiles(): Promise<string[]> {
  const response = await fetchWithTimeout(BACKEND_ENDPOINTS.API_PUBLIC_SHARES, {
    headers: {
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    if (response.status === 501) {
      const data = await response.json().catch(() => ({}))
      throw {
        message: data.error || "Public sharing is not enabled on this server",
        notEnabled: true,
      } as AppError
    }
    throw { message: `Server error: ${response.status}` } as AppError
  }

  const data = await response.json()
  if (!Array.isArray(data)) {
    throw { message: "Invalid response format" } as AppError
  }
  return data as string[]
}

/**
 * Share a file publicly.
 * @param path - Full path to the file (e.g., "photos/2026/image.jpg")
 * @returns SharePublicResult with shareId and path
 */
export async function sharePublic(path: string): Promise<SharePublicResult> {
  // Normalize path: remove leading/trailing slashes
  const normalizedPath = path.replace(/^\/+|\/+$/g, "")

  if (!normalizedPath) {
    throw { message: "Invalid path" } as AppError
  }

  // Build share URL (POST to /public-shares with JSON body)
  const shareUrl = BACKEND_ENDPOINTS.API_PUBLIC_SHARES.replace(/\/+$/, "")

  const response = await fetchWithTimeout(shareUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path: normalizedPath }),
  })

  let result: SharePublicResult | { error: string }
  try {
    result = await response.json()
  } catch {
    if (response.ok) {
      return { shareId: "", path: normalizedPath }
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
        return { shareId: "", path: normalizedPath }
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
 * Delete a public share.
 * @param path - The relative path of the file to unshare
 */
export async function deletePublicShare(path: string): Promise<void> {
  // Normalize path: remove leading/trailing slashes
  const normalizedPath = path.replace(/^\/+|\/+$/g, "")

  // Build delete URL with path as query parameter
  const url =
    BACKEND_ENDPOINTS.API_PUBLIC_SHARES +
    `?path=${encodeURIComponent(normalizedPath)}`

  const response = await fetchWithTimeout(url, {
    method: "DELETE",
  })

  if (!response.ok) {
    const data = await response.json().catch((err) => {
      console.warn("Failed to parse error response:", err)
      return {}
    })

    // Map status codes to user-friendly messages
    switch (response.status) {
      case 400:
        throw {
          message: data.error || "Invalid or missing path",
          status: 400,
        } as AppError
      case 404:
        throw {
          message: "Share does not exist",
          status: 404,
        } as AppError
      case 501:
        throw {
          message: "Public sharing is not enabled on this server",
          status: 501,
        } as AppError
      default:
        throw {
          message: data.error || `Failed to delete share: ${response.status}`,
          status: response.status,
        } as AppError
    }
  }
}
