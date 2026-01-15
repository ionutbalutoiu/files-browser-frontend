/**
 * FileTable stores barrel export.
 * Re-exports all state management for file table operations.
 */

// Menu state
export {
  type MenuPosition,
  getOpenMenu,
  getMenuPosition,
  toggleMenu,
  closeMenu,
  handleDocumentClick,
} from "./menuState.svelte"

// Delete state
export {
  type DeleteErrorState,
  getDeletingEntry,
  getDeleteError,
  getConfirmEntry,
  clearDeleteError,
  requestDelete,
  cancelDelete,
  confirmDelete,
} from "./deleteState.svelte"

// Rename state
export {
  type RenameErrorState,
  getRenamingEntry,
  getRenameValue,
  getRenameError,
  getIsSubmitting,
  setRenameValue,
  startRename,
  cancelRename,
  confirmRename,
} from "./renameState.svelte"

// Share state
export { getSharingEntry, handleShare } from "./shareState.svelte"
