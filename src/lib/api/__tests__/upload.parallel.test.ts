import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  uploadFilesInParallelWithProgress,
  type ParallelUploadProgress,
} from "../upload"

interface SuccessScenario {
  type: "success"
  delayMs?: number
  status?: number
  body?: { uploaded: string[]; skipped: string[]; errors?: string[] }
}

interface ApiErrorScenario {
  type: "apiError"
  delayMs?: number
  status: number
  message: string
}

interface NetworkErrorScenario {
  type: "networkError"
  delayMs?: number
}

type UploadScenario = SuccessScenario | ApiErrorScenario | NetworkErrorScenario

type ScenarioResolver = (context: {
  file: File
  fileName: string
  attempt: number
}) => UploadScenario

interface UploadListeners {
  progress: Array<(event: ProgressEvent) => void>
}

class FakeUploadTarget {
  private readonly listeners: UploadListeners = { progress: [] }

  addEventListener(type: string, listener: (event: ProgressEvent) => void) {
    if (type === "progress") {
      this.listeners.progress.push(listener)
    }
  }

  emitProgress(loaded: number, total: number) {
    const event = {
      loaded,
      total,
      lengthComputable: true,
    } as ProgressEvent

    for (const listener of this.listeners.progress) {
      listener(event)
    }
  }
}

interface XhrListeners {
  load: Array<() => void>
  error: Array<() => void>
  abort: Array<() => void>
}

function createXmlHttpRequestHarness() {
  const original = globalThis.XMLHttpRequest
  let resolver: ScenarioResolver = ({ fileName }) => ({
    type: "success",
    body: { uploaded: [fileName], skipped: [] },
  })

  let activeCount = 0
  let maxActiveCount = 0
  const attempts = new Map<string, number>()

  class FakeXMLHttpRequest {
    upload = new FakeUploadTarget()
    status = 0
    responseText = ""

    private readonly listeners: XhrListeners = {
      load: [],
      error: [],
      abort: [],
    }

    private timer: ReturnType<typeof setTimeout> | null = null
    private finished = false

    addEventListener(type: keyof XhrListeners, listener: () => void) {
      this.listeners[type].push(listener)
    }

    open() {
      // no-op
    }

    send(formData: FormData) {
      const file = formData.get("files")
      if (!(file instanceof File)) {
        throw new Error("Expected single file in FormData")
      }

      const attempt = (attempts.get(file.name) ?? 0) + 1
      attempts.set(file.name, attempt)

      activeCount += 1
      maxActiveCount = Math.max(maxActiveCount, activeCount)

      const scenario = resolver({ file, fileName: file.name, attempt })
      const delayMs = scenario.delayMs ?? 0

      this.upload.emitProgress(file.size, file.size)

      const run = () => {
        if (this.finished) return

        activeCount = Math.max(0, activeCount - 1)
        this.finished = true

        if (scenario.type === "networkError") {
          for (const listener of this.listeners.error) {
            listener()
          }
          return
        }

        if (scenario.type === "apiError") {
          this.status = scenario.status
          this.responseText = JSON.stringify({ error: scenario.message })
        } else {
          this.status = scenario.status ?? 200
          this.responseText = JSON.stringify(
            scenario.body ?? { uploaded: [file.name], skipped: [] },
          )
        }

        for (const listener of this.listeners.load) {
          listener()
        }
      }

      if (delayMs > 0) {
        this.timer = setTimeout(run, delayMs)
      } else {
        queueMicrotask(run)
      }
    }

    abort() {
      if (this.finished) return

      if (this.timer) {
        clearTimeout(this.timer)
      }

      activeCount = Math.max(0, activeCount - 1)
      this.finished = true

      for (const listener of this.listeners.abort) {
        listener()
      }
    }
  }

  function install() {
    globalThis.XMLHttpRequest =
      FakeXMLHttpRequest as unknown as typeof XMLHttpRequest
  }

  function restore() {
    globalThis.XMLHttpRequest = original
  }

  function setResolver(nextResolver: ScenarioResolver) {
    resolver = nextResolver
  }

  return {
    install,
    restore,
    setResolver,
    getMaxActiveCount: () => maxActiveCount,
    getAttempts: () => attempts,
  }
}

function makeFiles(names: string[]): File[] {
  return names.map(
    (name) => new File([name.repeat(8)], name, { type: "text/plain" }),
  )
}

describe("uploadFilesInParallelWithProgress", () => {
  const xhrHarness = createXmlHttpRequestHarness()

  beforeEach(() => {
    xhrHarness.install()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    xhrHarness.restore()
  })

  it("enforces max concurrency of 2 and tracks all selected files", async () => {
    const files = makeFiles(["a.txt", "b.txt", "c.txt", "d.txt", "e.txt"])
    const progressEvents: ParallelUploadProgress[] = []

    xhrHarness.setResolver(({ fileName }) => ({
      type: "success",
      delayMs: 20,
      body: { uploaded: [fileName], skipped: [] },
    }))

    const result = await uploadFilesInParallelWithProgress(files, "/", {
      concurrency: 2,
      onProgress: (progress) => progressEvents.push(progress),
    })

    expect(xhrHarness.getMaxActiveCount()).toBe(2)
    expect(result.uploaded).toEqual(files.map((file) => file.name))

    const finalProgress = progressEvents.at(-1)
    expect(finalProgress?.files).toHaveLength(files.length)
    expect(
      finalProgress?.files.every((file) => file.status === "uploaded"),
    ).toBe(true)
  })

  it("continues queue when one file already exists", async () => {
    const files = makeFiles(["fresh-1.txt", "existing.txt", "fresh-2.txt"])

    xhrHarness.setResolver(({ fileName }) => {
      if (fileName === "existing.txt") {
        return {
          type: "apiError",
          status: 409,
          message: "File already exists",
          delayMs: 5,
        }
      }

      return {
        type: "success",
        body: { uploaded: [fileName], skipped: [] },
      }
    })

    const result = await uploadFilesInParallelWithProgress(files, "/")

    expect(result.uploaded).toEqual(["fresh-1.txt", "fresh-2.txt"])
    expect(result.skipped).toEqual(["existing.txt"])
    expect(result.errors).toBeUndefined()
  })

  it("retries retryable failures up to 2 times with exponential backoff", async () => {
    const files = makeFiles(["retry.txt"])
    const timeoutSpy = vi.spyOn(globalThis, "setTimeout")

    xhrHarness.setResolver(({ fileName, attempt }) => {
      if (fileName === "retry.txt" && attempt < 3) {
        return { type: "networkError" }
      }

      return {
        type: "success",
        body: { uploaded: [fileName], skipped: [] },
      }
    })

    const result = await uploadFilesInParallelWithProgress(files, "/", {
      concurrency: 2,
      maxRetries: 2,
      retryBaseDelayMs: 300,
    })

    expect(result.uploaded).toEqual(["retry.txt"])
    expect(xhrHarness.getAttempts().get("retry.txt")).toBe(3)

    const timeoutValues = timeoutSpy.mock.calls
      .map((call) => call[1])
      .filter((value): value is number => typeof value === "number")

    expect(timeoutValues).toEqual(expect.arrayContaining([300, 600]))
  })

  it("cancels active and queued uploads without emitting errors", async () => {
    const files = makeFiles(["one.txt", "two.txt", "three.txt", "four.txt"])
    const controller = new AbortController()
    const progressEvents: ParallelUploadProgress[] = []

    xhrHarness.setResolver(({ fileName }) => ({
      type: "success",
      delayMs: fileName === "one.txt" || fileName === "two.txt" ? 80 : 0,
      body: { uploaded: [fileName], skipped: [] },
    }))

    const uploadPromise = uploadFilesInParallelWithProgress(files, "/", {
      signal: controller.signal,
      concurrency: 2,
      onProgress: (progress) => progressEvents.push(progress),
    })

    setTimeout(() => {
      controller.abort()
    }, 10)

    const result = await uploadPromise
    const finalProgress = progressEvents.at(-1)

    expect(result.uploaded).toEqual([])
    expect(result.skipped).toEqual([])
    expect(result.errors).toBeUndefined()
    expect(finalProgress?.cancelled).toBe(files.length)
    expect(
      finalProgress?.files.every((file) => file.status === "cancelled"),
    ).toBe(true)
  })

  it("returns deterministic output ordering by original selection", async () => {
    const files = makeFiles(["a.txt", "b.txt", "c.txt", "d.txt"])

    xhrHarness.setResolver(({ fileName }) => {
      const delayMap: Record<string, number> = {
        "a.txt": 60,
        "b.txt": 10,
        "c.txt": 45,
        "d.txt": 5,
      }

      return {
        type: "success",
        delayMs: delayMap[fileName] ?? 0,
        body: { uploaded: [fileName], skipped: [] },
      }
    })

    const result = await uploadFilesInParallelWithProgress(files, "/", {
      concurrency: 2,
    })

    expect(result.uploaded).toEqual(["a.txt", "b.txt", "c.txt", "d.txt"])
  })
})
