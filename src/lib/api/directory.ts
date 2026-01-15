/**
 * Directory browsing API.
 * Handles fetching directory listings and building file/directory URLs.
 */

import { parseNginxResponse } from "../nginxAutoindex"
import { buildApiUrl } from "../url"
import { API_ENDPOINTS } from "../constants"
import { fetchWithTimeout } from "./http"
import type { FetchResult, AppError } from "../types"

/**
 * Fetch directory listing from nginx autoindex.
 * Path should already be properly formatted (with trailing slash).
 */
export async function fetchDirectory(path: string): Promise<FetchResult> {
  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`

  // Build the fetch URL with proper normalization
  const url = buildApiUrl(API_ENDPOINTS.FILES, normalizedPath, true)

  const response = await fetchWithTimeout(url, {
    headers: {
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    const error: AppError = {
      message:
        response.status === 404
          ? "Directory not found"
          : `Server error: ${response.status}`,
      status: response.status,
    }
    throw error
  }

  // Check content type
  const contentType = response.headers.get("content-type") || ""
  if (!contentType.includes("application/json")) {
    throw { message: "Invalid response: expected JSON" } as AppError
  }

  let data: unknown
  try {
    data = await response.json()
  } catch {
    throw { message: "Failed to parse JSON response" } as AppError
  }

  try {
    const entries = parseNginxResponse(data)
    return { entries, path: normalizedPath }
  } catch (err) {
    throw {
      message:
        err instanceof Error
          ? err.message
          : "Failed to parse directory listing",
    } as AppError
  }
}

/**
 * Build the full URL for a file download/open.
 */
export function getFileUrl(directoryPath: string, fileName: string): string {
  const normalizedDir = directoryPath.startsWith("/")
    ? directoryPath
    : `/${directoryPath}`
  const encodedName = encodeURIComponent(fileName)
  return buildApiUrl(
    API_ENDPOINTS.FILES,
    `${normalizedDir}${encodedName}`,
    false,
  )
}

/**
 * Build the full URL for navigating to a subdirectory.
 */
export function getDirectoryUrl(
  directoryPath: string,
  dirName: string,
): string {
  const normalizedDir = directoryPath.startsWith("/")
    ? directoryPath
    : `/${directoryPath}`
  const encodedName = encodeURIComponent(dirName)
  return `${normalizedDir}${encodedName}/`
}
