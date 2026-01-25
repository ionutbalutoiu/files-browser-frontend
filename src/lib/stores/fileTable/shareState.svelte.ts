/**
 * Share state management for FileTable.
 * Handles file sharing operations.
 */

import { sharePublic, getDeletePath } from "../../api"
import { showToast } from "../toast.svelte"
import type { NginxEntry, AppError } from "../../types"
import { closeMenu } from "./menuState.svelte"

// State
let sharingEntry = $state<string | null>(null)

/**
 * Get the entry name currently being shared.
 */
export function getSharingEntry(): string | null {
  return sharingEntry
}

/**
 * Share a file publicly.
 *
 * @param entry - The file entry to share
 * @param currentPath - Current directory path
 */
export async function handleShare(
  entry: NginxEntry,
  currentPath: string,
): Promise<void> {
  closeMenu()

  // Only files can be shared
  if (entry.type === "directory") {
    return
  }

  sharingEntry = entry.name

  try {
    const path = getDeletePath(currentPath, entry.name)
    const result = await sharePublic(path)
    showToast(`File shared publicly: ${result.path}`, "success")
  } catch (err) {
    const error = err as AppError
    showToast(error.message, "error")
  } finally {
    sharingEntry = null
  }
}
