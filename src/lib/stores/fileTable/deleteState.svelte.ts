/**
 * Delete state management for FileTable.
 * Handles file/folder deletion operations.
 */

import { deleteFile, getDeletePath } from "../../api"
import type { NginxEntry, AppError } from "../../types"
import { closeMenu } from "./menuState.svelte"

// Types
export interface DeleteErrorState {
  name: string
  message: string
}

// State
let deletingEntry = $state<string | null>(null)
let deleteError = $state<DeleteErrorState | null>(null)
let confirmEntry = $state<NginxEntry | null>(null)

/**
 * Get the entry name currently being deleted.
 */
export function getDeletingEntry(): string | null {
  return deletingEntry
}

/**
 * Get the current delete error state.
 */
export function getDeleteError(): DeleteErrorState | null {
  return deleteError
}

/**
 * Get the entry awaiting deletion confirmation.
 */
export function getConfirmEntry(): NginxEntry | null {
  return confirmEntry
}

/**
 * Clear any existing delete error.
 */
export function clearDeleteError(): void {
  deleteError = null
}

/**
 * Request deletion of an entry (opens confirmation dialog).
 */
export function requestDelete(entry: NginxEntry): void {
  closeMenu()
  confirmEntry = entry
}

/**
 * Cancel the pending delete operation.
 */
export function cancelDelete(): void {
  confirmEntry = null
}

/**
 * Confirm and execute the delete operation.
 *
 * @param currentPath - Current directory path
 * @param onSuccess - Callback invoked on successful deletion
 */
export async function confirmDelete(
  currentPath: string,
  onSuccess: () => void,
): Promise<void> {
  if (!confirmEntry) return

  const entry = confirmEntry
  confirmEntry = null
  deletingEntry = entry.name
  deleteError = null

  try {
    const path = getDeletePath(currentPath, entry.name)
    await deleteFile(path)
    onSuccess()
  } catch (err) {
    deleteError = {
      name: entry.name,
      message: (err as AppError).message,
    }
  } finally {
    deletingEntry = null
  }
}
