import { render, screen } from "@testing-library/svelte"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import UploadStatusCard from "../UploadStatusCard.svelte"
import type { UploadSessionState } from "../../../lib/stores/uploadSession.svelte"

function createSessionState(
  partial: Partial<UploadSessionState> = {},
): UploadSessionState {
  return {
    phase: "uploading",
    isActive: true,
    progress: 42,
    targetPath: "/photos",
    totalFiles: 3,
    totalSize: "12 KB",
    uploaded: [],
    skipped: [],
    errors: [],
    validationErrors: [],
    files: [
      {
        id: "0",
        name: "one.txt",
        percent: 100,
        status: "uploaded",
        attempt: 1,
      },
      {
        id: "1",
        name: "two.txt",
        percent: 60,
        status: "uploading",
        attempt: 1,
      },
      {
        id: "2",
        name: "three.txt",
        percent: 0,
        status: "queued",
        attempt: 0,
      },
    ],
    completedCount: 1,
    failedCount: 0,
    cancelledCount: 0,
    remainingCount: 2,
    totalCount: 3,
    canRetryFailed: false,
    completionToken: 0,
    lastCompletedTargetPath: "/photos",
    ...partial,
  }
}

describe("UploadStatusCard", () => {
  it("renders all file rows from parallel progress state", () => {
    const state = createSessionState()

    render(UploadStatusCard, {
      sessionState: state,
      onCancel: vi.fn(),
      onRetryFailed: vi.fn(),
      onDismiss: vi.fn(),
    })

    const fileList = screen.getByLabelText("Per file upload progress")
    const items = fileList.querySelectorAll("li")

    expect(items).toHaveLength(3)
    expect(screen.getByText("one.txt")).toBeInTheDocument()
    expect(screen.getByText("two.txt")).toBeInTheDocument()
    expect(screen.getByText("three.txt")).toBeInTheDocument()
  })

  it("shows cancel action while uploading", async () => {
    const onCancel = vi.fn()

    render(UploadStatusCard, {
      sessionState: createSessionState({ phase: "uploading", isActive: true }),
      onCancel,
      onRetryFailed: vi.fn(),
      onDismiss: vi.fn(),
    })

    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: "Cancel all uploads" }))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(
      screen.queryByRole("button", { name: "Retry failed uploads" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Dismiss upload status" }),
    ).not.toBeInTheDocument()
  })

  it("shows retry failed action only after failures", async () => {
    const onRetryFailed = vi.fn()

    const { rerender } = render(UploadStatusCard, {
      sessionState: createSessionState({
        phase: "partial",
        isActive: false,
        canRetryFailed: true,
        failedCount: 1,
        errors: ["two.txt: Network error"],
        files: [
          {
            id: "0",
            name: "two.txt",
            percent: 100,
            status: "error",
            attempt: 3,
            message: "Network error",
          },
        ],
      }),
      onCancel: vi.fn(),
      onRetryFailed,
      onDismiss: vi.fn(),
    })

    expect(
      screen.getByRole("button", { name: "Retry failed uploads" }),
    ).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(
      screen.getByRole("button", { name: "Retry failed uploads" }),
    )
    expect(onRetryFailed).toHaveBeenCalledTimes(1)

    await rerender({
      sessionState: createSessionState({
        phase: "success",
        isActive: false,
        canRetryFailed: false,
        errors: [],
      }),
      onCancel: vi.fn(),
      onRetryFailed,
      onDismiss: vi.fn(),
    })

    expect(
      screen.queryByRole("button", { name: "Retry failed uploads" }),
    ).not.toBeInTheDocument()
  })
})
