import { fireEvent, render, screen, waitFor } from "@testing-library/svelte"
import { describe, expect, it, vi } from "vitest"
import ActionMenu from "../ActionMenu.svelte"

const defaultProps = {
  entry: {
    name: "report.txt",
    type: "file" as const,
    size: 128,
    mtime: "2026-01-01T00:00:00Z",
  },
  position: {
    top: 120,
    left: 220,
    openUpward: false,
  },
  onClose: vi.fn(),
  onShare: vi.fn(),
  onRename: vi.fn(),
  onDelete: vi.fn(),
  onSelect: vi.fn(),
}

describe("ActionMenu", () => {
  it("focuses first menu item and supports arrow navigation", async () => {
    render(ActionMenu, defaultProps)

    const shareButton = screen.getByRole("menuitem", { name: /share/i })
    const selectButton = screen.getByRole("menuitem", { name: /select/i })

    await waitFor(() => {
      expect(shareButton).toHaveFocus()
    })

    await fireEvent.keyDown(shareButton, { key: "ArrowDown" })
    expect(selectButton).toHaveFocus()

    await fireEvent.keyDown(selectButton, { key: "ArrowUp" })
    expect(shareButton).toHaveFocus()
  })

  it("closes on Escape", async () => {
    const onClose = vi.fn()

    render(ActionMenu, {
      ...defaultProps,
      onClose,
    })

    const menuItem = screen.getByRole("menuitem", { name: /rename/i })
    await fireEvent.keyDown(menuItem, { key: "Escape" })

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
