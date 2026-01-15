/**
 * HTTP utilities for API requests.
 * Provides fetch wrapper with timeout support.
 */

import { FETCH_TIMEOUT } from "../constants"
import type { AppError } from "../types"

/**
 * Fetch with timeout support using AbortController.
 * Throws an AppError if the request times out.
 *
 * @param url - The URL to fetch
 * @param options - Standard fetch options
 * @param timeout - Timeout in milliseconds (defaults to FETCH_TIMEOUT)
 * @returns The fetch Response
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = FETCH_TIMEOUT,
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    return response
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw {
        message: "Request timed out. Please try again.",
        code: "TIMEOUT",
      } as AppError
    }
    throw {
      message: "Network error. Please check your connection.",
      code: "NETWORK_ERROR",
      cause: err,
    } as AppError
  } finally {
    clearTimeout(timeoutId)
  }
}
