/**
 * File upload API.
 * Handles uploading files with optional progress tracking.
 */

import {
  BACKEND_ENDPOINTS,
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_LABEL,
} from "../constants"
import type { UploadResult, AppError } from "../types"

/**
 * Map HTTP status codes to user-friendly upload error messages.
 */
function getUploadErrorMessage(status: number): string {
  switch (status) {
    case 409:
      return "File already exists"
    case 413:
      return "File too large"
    case 415:
      return "File type not allowed"
    case 507:
      return "Not enough storage space"
    default:
      return `Upload failed (${status})`
  }
}

/**
 * Upload files to the server.
 * @param files - Files to upload
 * @param targetPath - Target directory path (e.g., "/photos/2026/")
 */
export async function uploadFiles(
  files: FileList | File[],
  targetPath: string,
): Promise<UploadResult> {
  const formData = new FormData()

  for (const file of files) {
    formData.append("files", file)
  }

  // Build upload URL with path as query parameter
  const normalizedPath = targetPath.replace(/^\/+|\/+$/g, "")
  let uploadUrl = BACKEND_ENDPOINTS.API_FILES
  if (normalizedPath) {
    uploadUrl += `?path=${encodeURIComponent(normalizedPath)}`
  }

  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: formData,
    // Don't set Content-Type - browser sets it with boundary
  })

  let result: UploadResult | { error: string }
  try {
    result = await response.json()
  } catch {
    throw { message: "Invalid server response" } as AppError
  }

  if ("error" in result) {
    throw { message: result.error } as AppError
  }

  if (!response.ok && !result.uploaded?.length) {
    throw { message: getUploadErrorMessage(response.status) } as AppError
  }

  return result
}

/**
 * Upload files with progress tracking.
 * @param files - Files to upload
 * @param targetPath - Target directory path
 * @param onProgress - Progress callback (0-100)
 */
export function uploadFilesWithProgress(
  files: FileList | File[],
  targetPath: string,
  onProgress: (percent: number) => void,
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    for (const file of files) {
      formData.append("files", file)
    }

    // Build upload URL with path as query parameter
    const normalizedPath = targetPath.replace(/^\/+|\/+$/g, "")
    let uploadUrl = BACKEND_ENDPOINTS.API_FILES
    if (normalizedPath) {
      uploadUrl += `?path=${encodeURIComponent(normalizedPath)}`
    }

    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100)
        onProgress(percent)
      }
    })

    xhr.addEventListener("load", () => {
      try {
        const result = JSON.parse(xhr.responseText)
        if ("error" in result && !result.uploaded?.length) {
          reject({ message: result.error } as AppError)
        } else if (xhr.status >= 200 && xhr.status < 300) {
          onProgress(100) // Ensure progress reaches 100% on success
          resolve(result)
        } else if (result.uploaded?.length) {
          // Partial success
          onProgress(100)
          resolve(result)
        } else {
          reject({ message: getUploadErrorMessage(xhr.status) } as AppError)
        }
      } catch {
        reject({ message: "Invalid server response" } as AppError)
      }
    })

    xhr.addEventListener("error", () => {
      reject({ message: "Network error" } as AppError)
    })

    xhr.addEventListener("abort", () => {
      reject({ message: "Upload cancelled" } as AppError)
    })

    xhr.open("PUT", uploadUrl)
    xhr.send(formData)
  })
}

/**
 * Validate files before upload (client-side).
 * @param files - Files to validate
 * @param existingNames - Names of files/folders already in the target directory
 */
export function validateFiles(
  files: FileList | File[],
  existingNames?: ReadonlyArray<string>,
): string[] {
  const errors: string[] = []
  const existingSet = existingNames ? new Set(existingNames) : null

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${file.name}: exceeds ${MAX_FILE_SIZE_LABEL} limit`)
    }
    if (file.name.startsWith(".")) {
      errors.push(`${file.name}: hidden files not allowed`)
    }
    if (existingSet?.has(file.name)) {
      errors.push(`${file.name}: file already exists in this folder`)
    }
  }

  return errors
}

/**
 * Format total size of files for display.
 */
export function formatTotalSize(files: FileList | File[]): string {
  const total = Array.from(files).reduce((sum, f) => sum + f.size, 0)

  if (total === 0) return "0 B"

  const units = ["B", "KB", "MB", "GB"]
  const exponent = Math.min(
    Math.floor(Math.log(total) / Math.log(1024)),
    units.length - 1,
  )

  const size = total / Math.pow(1024, exponent)
  const formatted = exponent === 0 ? size.toString() : size.toFixed(1)

  return `${formatted} ${units[exponent]}`
}
