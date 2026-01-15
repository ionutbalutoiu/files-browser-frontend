/**
 * Menu state management for FileTable.
 * Handles context menu positioning and visibility.
 */

import { MENU_HEIGHT, MENU_PADDING } from "../../constants"

// Types
export interface MenuPosition {
  top: number
  left: number
  openUpward: boolean
}

// State
let openMenu = $state<string | null>(null)
let menuPosition = $state<MenuPosition | null>(null)

/**
 * Get the currently open menu entry name.
 */
export function getOpenMenu(): string | null {
  return openMenu
}

/**
 * Get the current menu position.
 */
export function getMenuPosition(): MenuPosition | null {
  return menuPosition
}

/**
 * Toggle menu visibility for an entry.
 * Calculates position based on trigger element and viewport.
 */
export function toggleMenu(entryName: string, event: MouseEvent): void {
  event.stopPropagation()

  if (openMenu === entryName) {
    closeMenu()
    return
  }

  openMenu = entryName
  const trigger = event.currentTarget as HTMLButtonElement

  if (trigger) {
    const rect = trigger.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const spaceBelow = viewportHeight - rect.bottom
    const openUpward = spaceBelow < MENU_HEIGHT + MENU_PADDING

    menuPosition = {
      top: openUpward ? rect.top : rect.bottom,
      left: rect.right,
      openUpward,
    }
  }
}

/**
 * Close the menu and reset position.
 */
export function closeMenu(): void {
  openMenu = null
  menuPosition = null
}

/**
 * Handle document click to close menu when clicking outside.
 */
export function handleDocumentClick(): void {
  if (openMenu) {
    closeMenu()
  }
}
