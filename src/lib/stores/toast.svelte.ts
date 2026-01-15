/**
 * Centralized toast notification store.
 * Provides a simple API for showing toast messages across the app.
 */

import { TOAST_TIMEOUT } from "../constants"

// Toast state type
export interface ToastState {
  message: string
  type: "success" | "error"
  id: number
}

// Module-level reactive state (Svelte 5 runes in .svelte.ts)
let currentToast = $state<ToastState | null>(null)
let toastId = 0
let timeoutId: ReturnType<typeof setTimeout> | null = null

/**
 * Get the current toast state.
 * Use this in components to reactively display toasts.
 */
export function getToast(): ToastState | null {
  return currentToast
}

/**
 * Show a toast notification.
 * Automatically dismisses after TOAST_TIMEOUT.
 *
 * @param message - The message to display
 * @param type - 'success' or 'error'
 */
export function showToast(
  message: string,
  type: "success" | "error" = "success",
): void {
  // Clear any existing timeout
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }

  // Create new toast with unique ID
  toastId++
  const thisToastId = toastId
  currentToast = { message, type, id: thisToastId }

  // Auto-dismiss after timeout, verifying toast ID to prevent race conditions
  timeoutId = setTimeout(() => {
    if (currentToast?.id === thisToastId) {
      dismissToast()
    }
  }, TOAST_TIMEOUT)
}

/**
 * Dismiss the current toast immediately.
 */
export function dismissToast(): void {
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
  currentToast = null
}
