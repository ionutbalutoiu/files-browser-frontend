/**
 * Rename state management for FileTable.
 * Handles file/folder rename operations.
 */

import { renameFile, getDeletePath } from "../../api"
import { validateRename } from "../../validators"
import type { NginxEntry, AppError } from "../../types"
import { closeMenu } from "./menuState.svelte"

// Types
export interface RenameErrorState {
  name: string
  message: string
}

// State
let renamingEntry = $state<string | null>(null)
let renameValue = $state("")
let renameError = $state<RenameErrorState | null>(null)
let isSubmitting = $state(false)

/**
 * Get the entry name currently being renamed.
 */
export function getRenamingEntry(): string | null {
  return renamingEntry
}

/**
 * Get the current rename input value.
 */
export function getRenameValue(): string {
  return renameValue
}

/**
 * Get the current rename error state.
 */
export function getRenameError(): RenameErrorState | null {
  return renameError
}

/**
 * Check if rename is currently submitting.
 */
export function getIsSubmitting(): boolean {
  return isSubmitting
}

/**
 * Update the rename input value.
 * Clears any existing error so user can retry.
 */
export function setRenameValue(value: string): void {
  renameValue = value
  // Clear error when user starts typing again
  if (renameError) {
    renameError = null
  }
}

/**
 * Start renaming an entry.
 */
export function startRename(entry: NginxEntry): void {
  closeMenu()
  renameError = null
  renamingEntry = entry.name
  renameValue = entry.name
}

/**
 * Cancel the rename operation.
 */
export function cancelRename(): void {
  renamingEntry = null
  renameValue = ""
  renameError = null
}

/**
 * Confirm and execute the rename operation.
 *
 * @param currentPath - Current directory path
 * @param originalName - Original entry name
 * @param onSuccess - Callback with new name on successful rename
 */
export async function confirmRename(
  currentPath: string,
  originalName: string,
  onSuccess: (newName: string) => void,
): Promise<void> {
  const trimmedName = renameValue.trim()
  const validationResult = validateRename(trimmedName, originalName)

  // No change - cancel silently
  if (validationResult === null) {
    cancelRename()
    return
  }

  // Validation error
  if (validationResult) {
    renameError = { name: originalName, message: validationResult }
    return
  }

  isSubmitting = true

  try {
    const oldPath = getDeletePath(currentPath, originalName)
    await renameFile(oldPath, trimmedName)
    renameError = null
    renamingEntry = null
    onSuccess(trimmedName)
  } catch (err) {
    renameError = {
      name: originalName,
      message: (err as AppError).message,
    }
  } finally {
    isSubmitting = false
  }
}
