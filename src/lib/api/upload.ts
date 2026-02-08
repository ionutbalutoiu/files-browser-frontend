/**
 * File upload API.
 * Handles uploading files with optional progress tracking.
 */

import {
  BACKEND_ENDPOINTS,
  DEFAULT_UPLOAD_CONCURRENCY,
  DEFAULT_UPLOAD_MAX_RETRIES,
  DEFAULT_UPLOAD_RETRY_BASE_DELAY_MS,
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_LABEL,
} from "../constants"
import type { UploadResult, AppError } from "../types"

interface UploadApiError {
  error: string
}

interface UploadFailure {
  message: string
  status?: number
  retryable: boolean
  cancelled?: boolean
}

interface UploadResponseLike {
  status: number
  responseText: string
}

export interface ParallelUploadFileProgress {
  id: string
  name: string
  percent: number
  status:
    | "queued"
    | "uploading"
    | "retrying"
    | "uploaded"
    | "skipped"
    | "error"
    | "cancelled"
  attempt: number
  message?: string
}

export interface ParallelUploadProgress {
  percent: number
  completed: number
  failed: number
  cancelled: number
  remaining: number
  total: number
  uploadedBytes: number
  totalBytes: number
  files: ParallelUploadFileProgress[]
}

export interface ParallelUploadOptions {
  concurrency?: number
  maxRetries?: number
  retryBaseDelayMs?: number
  signal?: AbortSignal
  onProgress?: (progress: ParallelUploadProgress) => void
}

interface SingleFileProgress {
  loaded: number
  lengthComputable: boolean
}

interface SingleFileUploadOptions {
  signal?: AbortSignal
  onXhr?: (xhr: XMLHttpRequest) => void
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

function isRetryableStatus(status?: number): boolean {
  if (!status) return true
  return status === 408 || status === 429 || (status >= 500 && status !== 507)
}

function createUploadFailure(
  message: string,
  status?: number,
  cancelled = false,
): UploadFailure {
  return {
    message,
    status,
    cancelled,
    retryable: cancelled ? false : isRetryableStatus(status),
  }
}

function toUploadFailure(error: unknown): UploadFailure {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    const maybeFailure = error as UploadFailure
    return {
      message: maybeFailure.message,
      status: maybeFailure.status,
      cancelled: maybeFailure.cancelled,
      retryable:
        typeof maybeFailure.retryable === "boolean"
          ? maybeFailure.retryable
          : isRetryableStatus(maybeFailure.status),
    }
  }

  return createUploadFailure(normalizeAppErrorMessage(error))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function isUploadResult(value: unknown): value is UploadResult {
  if (!isRecord(value)) return false
  return (
    Array.isArray(value.uploaded) &&
    Array.isArray(value.skipped) &&
    (value.errors === undefined || Array.isArray(value.errors))
  )
}

function isUploadApiError(value: unknown): value is UploadApiError {
  return isRecord(value) && typeof value.error === "string"
}

function parseUploadResponse(
  response: UploadResponseLike,
): UploadResult | UploadFailure {
  let parsed: unknown

  try {
    parsed = JSON.parse(response.responseText)
  } catch {
    return createUploadFailure("Invalid server response", response.status)
  }

  if (isUploadResult(parsed)) {
    if (response.status >= 200 && response.status < 300) {
      return parsed
    }

    // Some backends return actionable upload/skipped info even on non-2xx status.
    if (parsed.uploaded.length > 0 || parsed.skipped.length > 0) {
      return parsed
    }

    if (parsed.errors && parsed.errors.length > 0) {
      return createUploadFailure(parsed.errors[0], response.status)
    }

    return createUploadFailure(
      getUploadErrorMessage(response.status),
      response.status,
    )
  }

  if (isUploadApiError(parsed)) {
    return createUploadFailure(parsed.error, response.status)
  }

  return createUploadFailure("Invalid server response", response.status)
}

function uploadSingleFileWithProgress(
  file: File,
  targetPath: string,
  onProgress: (progress: SingleFileProgress) => void,
  options: SingleFileUploadOptions = {},
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const { signal, onXhr } = options

    if (signal?.aborted) {
      reject(createUploadFailure("Upload cancelled", undefined, true))
      return
    }

    const formData = new FormData()
    formData.append("files", file)

    const xhr = new XMLHttpRequest()
    onXhr?.(xhr)

    const handleAbort = () => {
      xhr.abort()
    }

    signal?.addEventListener("abort", handleAbort, { once: true })

    function cleanup() {
      signal?.removeEventListener("abort", handleAbort)
    }

    xhr.upload.addEventListener("progress", (event) => {
      onProgress({
        loaded: event.loaded,
        lengthComputable: event.lengthComputable,
      })
    })

    xhr.addEventListener("load", () => {
      cleanup()
      const parsed = parseUploadResponse({
        status: xhr.status,
        responseText: xhr.responseText,
      })

      if (isUploadResult(parsed)) {
        resolve(parsed)
        return
      }

      reject(parsed)
    })

    xhr.addEventListener("error", () => {
      cleanup()
      reject(createUploadFailure("Network error", xhr.status || undefined))
    })

    xhr.addEventListener("abort", () => {
      cleanup()
      const abortedBySignal = signal?.aborted ?? false
      reject(
        createUploadFailure(
          abortedBySignal ? "Upload cancelled" : "Upload aborted",
          undefined,
          true,
        ),
      )
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
    // Don't set Content-Type - browser sets it with boundary.
  })

  const parsed = parseUploadResponse({
    status: response.status,
    responseText: await response.text(),
  })

  if (!isUploadResult(parsed)) {
    throw { message: parsed.message } as AppError
  }

  return parsed
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

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) return
      const percent = Math.round((event.loaded / event.total) * 100)
      onProgress(percent)
    })

    xhr.addEventListener("load", () => {
      const parsed = parseUploadResponse({
        status: xhr.status,
        responseText: xhr.responseText,
      })

      if (isUploadResult(parsed)) {
        onProgress(100)
        resolve(parsed)
        return
      }

      reject({ message: parsed.message } as AppError)
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isAlreadyExistsMessage(message: string): boolean {
  return /already exists|already exist|conflict/i.test(message)
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
      cancelled: 0,
      remaining: 0,
      total: 0,
      uploadedBytes: 0,
      totalBytes: 0,
      files: [],
    })
    return { uploaded: [], skipped: [] }
  }

  const signal = options.signal
  const maxConcurrency = Math.max(
    1,
    Math.min(options.concurrency ?? DEFAULT_UPLOAD_CONCURRENCY, total),
  )
  const maxRetries = Math.max(
    0,
    options.maxRetries ?? DEFAULT_UPLOAD_MAX_RETRIES,
  )
  const retryBaseDelayMs = Math.max(
    50,
    options.retryBaseDelayMs ?? DEFAULT_UPLOAD_RETRY_BASE_DELAY_MS,
  )

  const uploadedBytesByFile = new Array<number>(total).fill(0)
  const outcomes = new Array<PerFileOutcome | null>(total).fill(null)
  const fileProgressByIndex: ParallelUploadFileProgress[] = fileList.map(
    (file, index) => ({
      id: `${index}`,
      name: file.name,
      percent: 0,
      status: "queued",
      attempt: 0,
    }),
  )

  const totalBytes = fileList.reduce(
    (sum, file) => sum + Math.max(file.size, 0),
    0,
  )

  let nextFileIndex = 0
  let completed = 0
  let failed = 0
  let cancelled = 0
  let lastPercent = 0
  let aborted = signal?.aborted ?? false

  const activeXhrs = new Map<number, XMLHttpRequest>()

  const flushState = {
    pending: false,
    preferCountFallback: false,
  }

  function flushProgress() {
    flushState.pending = false

    const uploadedBytes = uploadedBytesByFile.reduce(
      (sum, size) => sum + size,
      0,
    )
    const doneCount = completed + failed + cancelled
    const remaining = Math.max(0, total - doneCount)

    const bytePercent =
      totalBytes > 0 ? Math.round((uploadedBytes / totalBytes) * 100) : 0
    const countPercent = Math.round((doneCount / total) * 100)

    let percent = totalBytes > 0 ? bytePercent : countPercent
    if (flushState.preferCountFallback) {
      percent = Math.max(percent, countPercent)
    }

    if (doneCount === total) {
      percent = 100
    }

    percent = Math.min(100, Math.max(lastPercent, percent))
    lastPercent = percent
    flushState.preferCountFallback = false

    onProgress({
      percent,
      completed,
      failed,
      cancelled,
      remaining,
      total,
      uploadedBytes,
      totalBytes,
      files: fileProgressByIndex.map((item) => ({ ...item })),
    })
  }

  function scheduleProgress(preferCountFallback = false) {
    flushState.preferCountFallback ||= preferCountFallback
    if (flushState.pending) return

    flushState.pending = true
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(flushProgress)
      return
    }

    setTimeout(flushProgress, 16)
  }

  function setFileProgress(
    index: number,
    patch: Partial<ParallelUploadFileProgress>,
  ) {
    fileProgressByIndex[index] = {
      ...fileProgressByIndex[index],
      ...patch,
    }
  }

  function markOutcomeIfUnset(index: number, outcome: PerFileOutcome) {
    if (outcomes[index]) return
    outcomes[index] = outcome
  }

  function markCancelled(index: number, message = "Upload cancelled") {
    const current = fileProgressByIndex[index]

    if (
      current.status === "uploaded" ||
      current.status === "skipped" ||
      current.status === "error" ||
      current.status === "cancelled"
    ) {
      return
    }

    cancelled += 1
    uploadedBytesByFile[index] = Math.max(
      uploadedBytesByFile[index],
      fileList[index].size,
    )
    setFileProgress(index, {
      percent: 100,
      status: "cancelled",
      message,
    })
    markOutcomeIfUnset(index, { uploaded: null, skipped: null, errors: [] })
    scheduleProgress(true)
  }

  function markFailed(index: number, message: string) {
    failed += 1
    uploadedBytesByFile[index] = Math.max(
      uploadedBytesByFile[index],
      fileList[index].size,
    )
    setFileProgress(index, {
      percent: 100,
      status: "error",
      message,
    })

    markOutcomeIfUnset(index, {
      uploaded: null,
      skipped: null,
      errors: [`${fileList[index].name}: ${message}`],
    })
    scheduleProgress(true)
  }

  function markCompleted(
    index: number,
    status: "uploaded" | "skipped",
    message?: string,
  ) {
    completed += 1
    uploadedBytesByFile[index] = Math.max(
      uploadedBytesByFile[index],
      fileList[index].size,
    )
    setFileProgress(index, {
      percent: 100,
      status,
      message,
    })
    scheduleProgress(true)
  }

  const abortHandler = () => {
    aborted = true
    for (const xhr of activeXhrs.values()) {
      xhr.abort()
    }
  }

  signal?.addEventListener("abort", abortHandler)

  async function processFile(index: number) {
    const file = fileList[index]

    if (aborted) {
      markCancelled(index)
      return
    }

    let attempt = 0

    while (attempt <= maxRetries) {
      if (aborted) {
        markCancelled(index)
        return
      }

      attempt += 1
      setFileProgress(index, {
        status: attempt > 1 ? "retrying" : "uploading",
        attempt,
        message:
          attempt > 1
            ? `Retrying (${attempt - 1}/${maxRetries})...`
            : undefined,
      })
      scheduleProgress(true)

      try {
        const result = await uploadSingleFileWithProgress(
          file,
          targetPath,
          (progress) => {
            const normalizedLoaded = Math.max(0, progress.loaded)
            const percent =
              file.size > 0
                ? Math.min(
                    100,
                    Math.round((normalizedLoaded / file.size) * 100),
                  )
                : progress.lengthComputable
                  ? 100
                  : 0

            if (file.size > 0) {
              uploadedBytesByFile[index] = Math.min(file.size, normalizedLoaded)
            }

            setFileProgress(index, {
              status: "uploading",
              percent,
              attempt,
              message: undefined,
            })
            scheduleProgress(!progress.lengthComputable)
          },
          {
            signal,
            onXhr: (xhr) => {
              activeXhrs.set(index, xhr)
            },
          },
        )

        activeXhrs.delete(index)

        const uploadedName = result.uploaded.includes(file.name)
          ? file.name
          : (result.uploaded[0] ?? null)
        const skippedName = result.skipped.includes(file.name)
          ? file.name
          : (result.skipped[0] ?? null)

        if (uploadedName) {
          markCompleted(index, "uploaded")
          outcomes[index] = {
            uploaded: uploadedName,
            skipped: null,
            errors: result.errors ? [...result.errors] : [],
          }
          return
        }

        if (skippedName) {
          markCompleted(index, "skipped", "Already exists")
          outcomes[index] = {
            uploaded: null,
            skipped: skippedName,
            errors: result.errors ? [...result.errors] : [],
          }
          return
        }

        const failureMessage = result.errors?.[0] ?? "Upload failed"
        const retryable = !isAlreadyExistsMessage(failureMessage)
        if (retryable && attempt <= maxRetries) {
          await sleep(retryBaseDelayMs * Math.pow(2, attempt - 1))
          continue
        }

        markFailed(index, failureMessage)
        return
      } catch (error) {
        activeXhrs.delete(index)

        const failure = toUploadFailure(error)

        if (failure.cancelled || aborted) {
          markCancelled(index)
          return
        }

        if (failure.status === 409 || isAlreadyExistsMessage(failure.message)) {
          markCompleted(index, "skipped", "Already exists")
          outcomes[index] = {
            uploaded: null,
            skipped: file.name,
            errors: [],
          }
          return
        }

        if (failure.retryable && attempt <= maxRetries) {
          await sleep(retryBaseDelayMs * Math.pow(2, attempt - 1))
          continue
        }

        markFailed(index, failure.message)
        return
      }
    }

    markFailed(index, "Upload failed")
  }

  async function worker() {
    while (true) {
      if (aborted) return

      const index = nextFileIndex
      if (index >= total) return

      nextFileIndex += 1
      await processFile(index)
    }
  }

  scheduleProgress(true)

  await Promise.all(Array.from({ length: maxConcurrency }, () => worker()))

  if (aborted) {
    for (let index = 0; index < total; index += 1) {
      markCancelled(index)
    }
  }

  signal?.removeEventListener("abort", abortHandler)
  flushProgress()

  const uploaded: string[] = []
  const skipped: string[] = []
  const errors: string[] = []

  for (let index = 0; index < total; index += 1) {
    const outcome = outcomes[index]
    if (!outcome) continue

    if (outcome.uploaded) {
      uploaded.push(outcome.uploaded)
    }

    if (outcome.skipped) {
      skipped.push(outcome.skipped)
    }

    for (const message of outcome.errors) {
      if (!message) continue
      if (message.startsWith(`${fileList[index].name}:`)) {
        errors.push(message)
      } else {
        errors.push(`${fileList[index].name}: ${message}`)
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
  const total = Array.from(files).reduce((sum, file) => sum + file.size, 0)

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
