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

interface UploadApiError {
  error: string
}

export interface ParallelUploadProgress {
  percent: number
  completed: number
  failed: number
  remaining: number
  total: number
  uploadedBytes: number
  totalBytes: number
  files: ParallelUploadFileProgress[]
}

export interface ParallelUploadOptions {
  concurrency?: number
  onProgress?: (progress: ParallelUploadProgress) => void
}

export interface ParallelUploadFileProgress {
  name: string
  percent: number
  status: "queued" | "uploading" | "uploaded" | "skipped" | "error"
  message?: string
}

interface SingleFileProgress {
  loaded: number
  lengthComputable: boolean
}

interface PerFileOutcome {
  uploaded: string | null
  skipped: string | null
  errors: string[]
}

function buildUploadUrl(targetPath: string): string {
  const normalizedPath = targetPath.replace(/^\/+|\/+$/g, "")
  let uploadUrl = BACKEND_ENDPOINTS.API_FILES
  if (normalizedPath) {
    uploadUrl += `?path=${encodeURIComponent(normalizedPath)}`
  }
  return uploadUrl
}

function normalizeAppErrorMessage(error: unknown): string {
  const appError = error as AppError
  return appError.message || "Upload failed"
}

function mergeUploadResponse(
  xhr: XMLHttpRequest,
): UploadResult | { message: string } {
  let result: UploadResult | UploadApiError
  try {
    result = JSON.parse(xhr.responseText)
  } catch {
    return { message: "Invalid server response" }
  }

  if ("error" in result && !result.uploaded?.length) {
    return { message: result.error }
  }

  if (xhr.status >= 200 && xhr.status < 300) {
    return result as UploadResult
  }

  if (
    result.uploaded?.length ||
    result.skipped?.length ||
    result.errors?.length
  ) {
    return result as UploadResult
  }

  return { message: getUploadErrorMessage(xhr.status) }
}

function uploadSingleFileWithProgress(
  file: File,
  targetPath: string,
  onProgress: (progress: SingleFileProgress) => void,
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append("files", file)

    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener("progress", (e) => {
      onProgress({
        loaded: e.loaded,
        lengthComputable: e.lengthComputable,
      })
    })

    xhr.addEventListener("load", () => {
      const merged = mergeUploadResponse(xhr)
      if ("message" in merged) {
        reject({ message: merged.message } as AppError)
        return
      }

      resolve(merged)
    })

    xhr.addEventListener("error", () => {
      reject({ message: "Network error" } as AppError)
    })

    xhr.addEventListener("abort", () => {
      reject({ message: "Upload cancelled" } as AppError)
    })

    xhr.open("PUT", buildUploadUrl(targetPath))
    xhr.send(formData)
  })
}

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

  const response = await fetch(buildUploadUrl(targetPath), {
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

    xhr.open("PUT", buildUploadUrl(targetPath))
    xhr.send(formData)
  })
}

/**
 * Upload files in parallel with aggregated progress tracking.
 * @param files - Files to upload
 * @param targetPath - Target directory path
 * @param options - Parallel upload options
 */
export async function uploadFilesInParallelWithProgress(
  files: FileList | File[],
  targetPath: string,
  options: ParallelUploadOptions = {},
): Promise<UploadResult> {
  const fileList = Array.from(files)
  const total = fileList.length
  const onProgress = options.onProgress ?? (() => {})

  if (total === 0) {
    onProgress({
      percent: 100,
      completed: 0,
      failed: 0,
      remaining: 0,
      total: 0,
      uploadedBytes: 0,
      totalBytes: 0,
      files: [],
    })
    return { uploaded: [], skipped: [] }
  }

  const maxConcurrency = Math.max(1, Math.min(options.concurrency ?? 2, total))
  const uploadedBytesByFile = new Array<number>(total).fill(0)
  const outcomes = new Array<PerFileOutcome>(total)
  const fileProgressByIndex = fileList.map((file) => ({
    name: file.name,
    percent: 0,
    status: "queued" as const,
  }))
  const totalBytes = fileList.reduce(
    (sum, file) => sum + Math.max(file.size, 0),
    0,
  )

  let nextFileIndex = 0
  let completed = 0
  let failed = 0
  let lastPercent = 0

  function emitProgress(preferCountFallback = false) {
    const uploadedBytes = uploadedBytesByFile.reduce(
      (sum, size) => sum + size,
      0,
    )
    const doneCount = completed + failed
    const remaining = Math.max(0, total - doneCount)

    const bytePercent =
      totalBytes > 0 ? Math.round((uploadedBytes / totalBytes) * 100) : 0
    const countPercent = Math.round((doneCount / total) * 100)

    let percent = totalBytes > 0 ? bytePercent : countPercent
    if (preferCountFallback) {
      percent = Math.max(percent, countPercent)
    }

    if (doneCount === total) {
      percent = 100
    }

    percent = Math.min(100, Math.max(lastPercent, percent))
    lastPercent = percent

    onProgress({
      percent,
      completed,
      failed,
      remaining,
      total,
      uploadedBytes,
      totalBytes,
      files: fileProgressByIndex.map((item) => ({ ...item })),
    })
  }

  async function processFile(index: number) {
    const file = fileList[index]
    fileProgressByIndex[index] = {
      ...fileProgressByIndex[index],
      status: "uploading",
      message: undefined,
    }
    emitProgress(true)

    try {
      const result = await uploadSingleFileWithProgress(
        file,
        targetPath,
        (progress) => {
          const normalizedLoaded = Math.max(0, progress.loaded)
          const percent =
            file.size > 0
              ? Math.min(100, Math.round((normalizedLoaded / file.size) * 100))
              : progress.lengthComputable
                ? 100
                : 0

          if (file.size > 0) {
            uploadedBytesByFile[index] = Math.min(file.size, normalizedLoaded)
          }
          fileProgressByIndex[index] = {
            ...fileProgressByIndex[index],
            status: "uploading",
            percent,
            message: undefined,
          }
          emitProgress(!progress.lengthComputable)
        },
      )

      const uploadedName = result.uploaded.includes(file.name)
        ? file.name
        : (result.uploaded[0] ?? null)
      const skippedName = result.skipped.includes(file.name)
        ? file.name
        : (result.skipped[0] ?? null)
      const outcomeErrors = result.errors ? [...result.errors] : []

      if (uploadedName || skippedName) {
        completed += 1
        fileProgressByIndex[index] = {
          ...fileProgressByIndex[index],
          percent: 100,
          status: uploadedName ? "uploaded" : "skipped",
          message: undefined,
        }
        outcomes[index] = {
          uploaded: uploadedName,
          skipped: skippedName,
          errors: outcomeErrors,
        }
      } else {
        failed += 1
        const failureMessage =
          outcomeErrors.length > 0
            ? outcomeErrors[0]
            : `${file.name}: upload failed`
        fileProgressByIndex[index] = {
          ...fileProgressByIndex[index],
          percent: 100,
          status: "error",
          message: failureMessage,
        }
        outcomes[index] = {
          uploaded: null,
          skipped: null,
          errors: outcomeErrors.length > 0 ? outcomeErrors : [failureMessage],
        }
      }
    } catch (error) {
      failed += 1
      const failureMessage = normalizeAppErrorMessage(error)
      fileProgressByIndex[index] = {
        ...fileProgressByIndex[index],
        percent: 100,
        status: "error",
        message: failureMessage,
      }
      outcomes[index] = {
        uploaded: null,
        skipped: null,
        errors: [`${file.name}: ${failureMessage}`],
      }
    } finally {
      if (file.size > 0) {
        uploadedBytesByFile[index] = file.size
      }
      emitProgress(true)
    }
  }

  async function worker() {
    while (true) {
      const index = nextFileIndex
      if (index >= total) return
      nextFileIndex += 1
      await processFile(index)
    }
  }

  emitProgress(true)

  await Promise.all(Array.from({ length: maxConcurrency }, () => worker()))

  const uploaded: string[] = []
  const skipped: string[] = []
  const errors: string[] = []

  for (let index = 0; index < total; index += 1) {
    const outcome = outcomes[index]
    const file = fileList[index]
    if (!outcome) continue

    if (outcome.uploaded) {
      uploaded.push(outcome.uploaded)
    }

    if (outcome.skipped) {
      skipped.push(outcome.skipped)
    }

    for (const message of outcome.errors) {
      if (!message) continue
      if (message.startsWith(`${file.name}:`)) {
        errors.push(message)
      } else {
        errors.push(`${file.name}: ${message}`)
      }
    }
  }

  if (errors.length > 0) {
    return { uploaded, skipped, errors }
  }

  return { uploaded, skipped }
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
