import { fireEvent, render } from "@testing-library/svelte"
import { afterEach, describe, expect, it, vi } from "vitest"
import FileTableRow from "../FileTableRow.svelte"

afterEach(() => {
  vi.restoreAllMocks()
})

function createProps(overrides: Record<string, unknown> = {}) {
  return {
    entry: {
      name: "report.txt",
      type: "file" as const,
      size: 128,
      mtime: "2026-01-01T00:00:00Z",
    },
    currentPath: "/",
    isMenuOpen: false,
    isDeleting: false,
    isRenaming: false,
    renameValue: "report.txt",
    renameError: null,
    deleteError: null,
    isSubmitting: false,
    isDragging: false,
    isDropTarget: false,
    onNavigate: vi.fn(),
    onMenuToggle: vi.fn(),
    onRenameChange: vi.fn(),
    onRenameConfirm: vi.fn(),
    onRenameCancel: vi.fn(),
    onDragStart: vi.fn(),
    onDragEnd: vi.fn(),
    onDrop: vi.fn(),
    onDragEnter: vi.fn(),
    onDragLeave: vi.fn(),
    ...overrides,
  }
}

describe("FileTableRow", () => {
  it("opens file with noopener/noreferrer when row is keyboard-activated", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null)
    const { container } = render(FileTableRow, createProps())

    const row = container.querySelector("tr")
    expect(row).toBeTruthy()

    row!.focus()
    await fireEvent.keyDown(row!, { key: "Enter" })

    expect(openSpy).toHaveBeenCalledWith(
      "/files/report.txt",
      "_blank",
      "noopener,noreferrer",
    )
  })

  it("does not trigger row navigation when key events originate from menu button", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null)
    const { container } = render(FileTableRow, createProps())

    const menuButton = container.querySelector(".menu-trigger")
    expect(menuButton).toBeTruthy()

    await fireEvent.keyDown(menuButton!, { key: " " })
    expect(openSpy).not.toHaveBeenCalled()
  })
})
