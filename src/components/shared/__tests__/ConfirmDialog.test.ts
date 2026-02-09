import { fireEvent, render, screen } from "@testing-library/svelte"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import ConfirmDialog from "../ConfirmDialog.svelte"

describe("ConfirmDialog", () => {
  it("focuses the first action button on mount", async () => {
    render(ConfirmDialog, {
      title: "Delete file",
      onConfirm: vi.fn(),
      onCancel: vi.fn(),
    })

    const cancelButton = await screen.findByRole("button", { name: "Cancel" })
    expect(cancelButton).toHaveFocus()
  })

  it("closes on Escape when focus is inside dialog controls", async () => {
    const onCancel = vi.fn()

    render(ConfirmDialog, {
      title: "Delete file",
      onConfirm: vi.fn(),
      onCancel,
    })

    const confirmButton = screen.getByRole("button", { name: "Confirm" })
    confirmButton.focus()

    await userEvent.keyboard("{Escape}")
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it("only closes on overlay click, not dialog content click", async () => {
    const onCancel = vi.fn()

    const { container } = render(ConfirmDialog, {
      title: "Delete file",
      onConfirm: vi.fn(),
      onCancel,
    })

    const dialog = container.querySelector(".dialog")
    const overlay = container.querySelector(".dialog-overlay")

    expect(dialog).toBeTruthy()
    expect(overlay).toBeTruthy()

    await fireEvent.click(dialog!)
    expect(onCancel).not.toHaveBeenCalled()

    await fireEvent.click(overlay!)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
