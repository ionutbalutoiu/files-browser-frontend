import {
  DEFAULT_UPLOAD_CONCURRENCY,
  DEFAULT_UPLOAD_MAX_RETRIES,
  DEFAULT_UPLOAD_RETRY_BASE_DELAY_MS,
} from "../constants"
import {
  uploadFilesInParallelWithProgress,
  validateFiles,
  formatTotalSize,
  type ParallelUploadFileProgress,
} from "../api"
import type { AppError } from "../types"

export type UploadSessionPhase =
  | "hidden"
  | "validation"
  | "uploading"
  | "success"
  | "partial"
  | "error"
  | "cancelled"

export interface UploadSessionState {
  phase: UploadSessionPhase
  isActive: boolean
  progress: number
  targetPath: string
  totalFiles: number
  totalSize: string
  uploaded: string[]
  skipped: string[]
  errors: string[]
  validationErrors: string[]
  files: ParallelUploadFileProgress[]
  completedCount: number
  failedCount: number
  cancelledCount: number
  remainingCount: number
  totalCount: number
  canRetryFailed: boolean
  completionToken: number
  lastCompletedTargetPath: string
}

interface StartUploadSessionInput {
  files: File[]
  targetPath: string
}

const initialState: UploadSessionState = {
  phase: "hidden",
  isActive: false,
  progress: 0,
  targetPath: "/",
  totalFiles: 0,
  totalSize: "0 B",
  uploaded: [],
  skipped: [],
  errors: [],
  validationErrors: [],
  files: [],
  completedCount: 0,
  failedCount: 0,
  cancelledCount: 0,
  remainingCount: 0,
  totalCount: 0,
  canRetryFailed: false,
  completionToken: 0,
  lastCompletedTargetPath: "/",
}

let sessionState = $state<UploadSessionState>({ ...initialState })
let activeAbortController: AbortController | null = null
let currentFiles: File[] = []

function resetState(): void {
  sessionState = { ...initialState }
  activeAbortController = null
  currentFiles = []
}

function normalizeErrorMessage(error: unknown): string {
  const appError = error as AppError
  return appError.message || "Upload failed"
}

function updateCanRetryFailed(): void {
  sessionState.canRetryFailed = sessionState.files.some(
    (item) => item.status === "error",
  )
}

async function runUpload(files: File[], targetPath: string): Promise<void> {
  activeAbortController = new AbortController()

  sessionState.phase = "uploading"
  sessionState.isActive = true
  sessionState.targetPath = targetPath || "/"
  sessionState.totalFiles = files.length
  sessionState.totalSize = formatTotalSize(files)
  sessionState.progress = 0
  sessionState.uploaded = []
  sessionState.skipped = []
  sessionState.errors = []
  sessionState.validationErrors = []
  sessionState.files = files.map((file, index) => ({
    id: `${index}`,
    name: file.name,
    percent: 0,
    status: "queued",
    attempt: 0,
  }))
  sessionState.completedCount = 0
  sessionState.failedCount = 0
  sessionState.cancelledCount = 0
  sessionState.remainingCount = files.length
  sessionState.totalCount = files.length
  sessionState.canRetryFailed = false

  let latestCancelledCount = 0

  try {
    const result = await uploadFilesInParallelWithProgress(files, targetPath, {
      concurrency: DEFAULT_UPLOAD_CONCURRENCY,
      maxRetries: DEFAULT_UPLOAD_MAX_RETRIES,
      retryBaseDelayMs: DEFAULT_UPLOAD_RETRY_BASE_DELAY_MS,
      signal: activeAbortController.signal,
      onProgress: (progress) => {
        sessionState.progress = progress.percent
        sessionState.completedCount = progress.completed
        sessionState.failedCount = progress.failed
        sessionState.cancelledCount = progress.cancelled
        sessionState.remainingCount = progress.remaining
        sessionState.totalCount = progress.total
        sessionState.files = progress.files
        latestCancelledCount = progress.cancelled
      },
    })

    sessionState.uploaded = result.uploaded
    sessionState.skipped = result.skipped
    sessionState.errors = result.errors ?? []

    if (
      latestCancelledCount > 0 &&
      result.uploaded.length === 0 &&
      result.skipped.length === 0 &&
      sessionState.errors.length === 0
    ) {
      sessionState.phase = "cancelled"
    } else if (result.uploaded.length === 0 && sessionState.errors.length > 0) {
      sessionState.phase = "error"
    } else if (
      result.skipped.length > 0 ||
      sessionState.errors.length > 0 ||
      latestCancelledCount > 0
    ) {
      sessionState.phase = "partial"
    } else {
      sessionState.phase = "success"
    }
  } catch (error) {
    if (activeAbortController.signal.aborted) {
      sessionState.phase = "cancelled"
      sessionState.errors = []
    } else {
      sessionState.phase = "error"
      sessionState.errors = [normalizeErrorMessage(error)]
    }
  } finally {
    sessionState.isActive = false
    sessionState.lastCompletedTargetPath = sessionState.targetPath
    sessionState.completionToken += 1
    updateCanRetryFailed()
    activeAbortController = null
  }
}

export function getUploadSessionState(): UploadSessionState {
  return sessionState
}

export async function startUploadSession({
  files,
  targetPath,
}: StartUploadSessionInput): Promise<void> {
  if (sessionState.phase === "uploading") return
  if (files.length === 0) return

  currentFiles = [...files]

  sessionState.phase = "hidden"
  sessionState.isActive = false
  sessionState.progress = 0
  sessionState.targetPath = targetPath || "/"
  sessionState.totalFiles = files.length
  sessionState.totalSize = formatTotalSize(files)
  sessionState.uploaded = []
  sessionState.skipped = []
  sessionState.errors = []
  sessionState.validationErrors = []
  sessionState.files = []
  sessionState.completedCount = 0
  sessionState.failedCount = 0
  sessionState.cancelledCount = 0
  sessionState.remainingCount = files.length
  sessionState.totalCount = files.length
  sessionState.canRetryFailed = false

  const validationErrors = validateFiles(files)
  if (validationErrors.length > 0) {
    sessionState.phase = "validation"
    sessionState.isActive = false
    sessionState.validationErrors = validationErrors
    sessionState.files = files.map((file, index) => ({
      id: `${index}`,
      name: file.name,
      percent: 0,
      status: "queued",
      attempt: 0,
      message: undefined,
    }))
    updateCanRetryFailed()
    return
  }

  await runUpload(files, targetPath)
}

export function cancelUploadSession(): void {
  if (sessionState.phase !== "uploading") return
  activeAbortController?.abort()
}

export async function retryFailedUploads(): Promise<void> {
  if (sessionState.phase === "uploading") return

  const retryIndexes = sessionState.files
    .filter((file) => file.status === "error")
    .map((file) => Number(file.id))
    .filter((index) => Number.isInteger(index) && index >= 0)

  if (retryIndexes.length === 0) return

  const retryFiles = retryIndexes
    .map((index) => currentFiles[index])
    .filter((file): file is File => Boolean(file))

  if (retryFiles.length === 0) return

  currentFiles = [...retryFiles]
  await runUpload(retryFiles, sessionState.targetPath)
}

export function dismissUploadSession(): void {
  if (sessionState.phase === "uploading") return
  resetState()
}
