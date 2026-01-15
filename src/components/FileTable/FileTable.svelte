<script lang="ts">
  import type {
    NginxEntry,
    SortField,
    SortState,
    AppError,
  } from "../../lib/types"
  import {
    deleteFile,
    getDeletePath,
    renameFile,
    sharePublic,
  } from "../../lib/api"
  import { showToast } from "../../lib/stores/toast.svelte"
  import { validateRename } from "../../lib/validators"
  import { MENU_HEIGHT, MENU_PADDING } from "../../lib/constants"
  import FileTableHeader from "./FileTableHeader.svelte"
  import FileTableRow from "./FileTableRow.svelte"
  import ActionMenu from "./ActionMenu.svelte"
  import ConfirmDialog from "../shared/ConfirmDialog.svelte"

  interface Props {
    entries: NginxEntry[]
    currentPath: string
    sort: SortState
    onNavigate: (path: string) => void
    onSortChange: (field: SortField) => void
    onDelete: () => void
  }

  let {
    entries,
    currentPath,
    sort,
    onNavigate,
    onSortChange,
    onDelete,
  }: Props = $props()

  // Menu state
  let openMenu = $state<string | null>(null)
  let menuPosition = $state<{
    top: number
    left: number
    openUpward: boolean
  } | null>(null)

  // Delete state
  let deletingEntry = $state<string | null>(null)
  let deleteError = $state<{ name: string; message: string } | null>(null)
  let confirmEntry = $state<NginxEntry | null>(null)

  // Rename state
  let renamingEntry = $state<string | null>(null)
  let renameValue = $state("")
  let renameError = $state<{ name: string; message: string } | null>(null)
  let isSubmitting = $state(false)

  // Share state
  let sharingEntry = $state<string | null>(null)

  // Menu handlers
  function toggleMenu(entryName: string, event: MouseEvent) {
    event.stopPropagation()
    if (openMenu === entryName) {
      closeMenu()
    } else {
      openMenu = entryName
      deleteError = null
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
  }

  function closeMenu() {
    openMenu = null
    menuPosition = null
  }

  function handleDocumentClick() {
    if (openMenu) {
      closeMenu()
    }
  }

  // Delete handlers
  function requestDelete(entry: NginxEntry) {
    closeMenu()
    confirmEntry = entry
  }

  function cancelDelete() {
    confirmEntry = null
  }

  async function confirmDeleteAction() {
    if (!confirmEntry) return

    const entry = confirmEntry
    confirmEntry = null
    deletingEntry = entry.name
    deleteError = null

    try {
      const path = getDeletePath(currentPath, entry.name)
      await deleteFile(path)
      onDelete()
    } catch (err) {
      deleteError = {
        name: entry.name,
        message: (err as AppError).message,
      }
    } finally {
      deletingEntry = null
    }
  }

  // Share handler
  async function handleShare(entry: NginxEntry) {
    closeMenu()

    if (entry.type === "directory") {
      return
    }

    sharingEntry = entry.name

    try {
      const path = getDeletePath(currentPath, entry.name)
      const result = await sharePublic(path)
      showToast(`File shared publicly: ${result.shared}`, "success")
    } catch (err) {
      const error = err as AppError
      showToast(error.message, "error")
    } finally {
      sharingEntry = null
    }
  }

  // Rename handlers
  function startRename(entry: NginxEntry) {
    closeMenu()
    renameError = null
    renamingEntry = entry.name
    renameValue = entry.name
  }

  function cancelRename() {
    renamingEntry = null
    renameValue = ""
    renameError = null
  }

  async function confirmRename(originalName: string) {
    const trimmedName = renameValue.trim()
    const validationResult = validateRename(trimmedName, originalName)

    if (validationResult === null) {
      cancelRename()
      return
    }

    if (validationResult) {
      renameError = { name: originalName, message: validationResult }
      return
    }

    isSubmitting = true

    try {
      const oldPath = getDeletePath(currentPath, originalName)
      await renameFile(oldPath, trimmedName)
      const entryIndex = entries.findIndex((e) => e.name === originalName)
      if (entryIndex !== -1) {
        entries[entryIndex] = { ...entries[entryIndex], name: trimmedName }
        entries = [...entries]
      }
      renameError = null
      renamingEntry = null
    } catch (err) {
      renameError = {
        name: originalName,
        message: (err as AppError).message,
      }
    } finally {
      isSubmitting = false
    }
  }

  // Get current entry for menu
  let currentMenuEntry = $derived(
    openMenu ? entries.find((e) => e.name === openMenu) : null,
  )
</script>

<svelte:document onclick={handleDocumentClick} />

<div class="table-container">
  <table class="file-table" role="grid">
    <FileTableHeader {sort} {onSortChange} />
    <tbody>
      {#if entries.length === 0}
        <tr class="empty-row">
          <td colspan="4">No files found</td>
        </tr>
      {:else}
        {#each entries as entry (entry.name)}
          <FileTableRow
            {entry}
            {currentPath}
            isMenuOpen={openMenu === entry.name}
            isDeleting={deletingEntry === entry.name}
            isRenaming={renamingEntry === entry.name}
            {renameValue}
            renameError={renameError?.name === entry.name
              ? renameError.message
              : null}
            deleteError={deleteError?.name === entry.name
              ? deleteError.message
              : null}
            {isSubmitting}
            {onNavigate}
            onMenuToggle={toggleMenu}
            onRenameChange={(value) => (renameValue = value)}
            onRenameConfirm={() => confirmRename(entry.name)}
            onRenameCancel={cancelRename}
          />
        {/each}
      {/if}
    </tbody>
  </table>
</div>

<!-- Context Menu Portal -->
{#if currentMenuEntry && menuPosition}
  <ActionMenu
    entry={currentMenuEntry}
    position={menuPosition}
    isSharing={sharingEntry === currentMenuEntry.name}
    onShare={handleShare}
    onRename={startRename}
    onDelete={requestDelete}
  />
{/if}

<!-- Confirmation Dialog -->
{#if confirmEntry}
  <ConfirmDialog
    title={confirmEntry.type === "directory" ? "Delete Folder" : "Delete File"}
    confirmLabel="Delete"
    variant="danger"
    onConfirm={confirmDeleteAction}
    onCancel={cancelDelete}
  >
    {#if confirmEntry.type === "directory"}
      <p>
        Delete folder <strong>"{confirmEntry.name}"</strong>? It must be empty.
      </p>
    {:else}
      <p>
        Delete <strong>"{confirmEntry.name}"</strong>? This cannot be undone.
      </p>
    {/if}
  </ConfirmDialog>
{/if}

<style>
  .table-container {
    overflow-x: auto;
    margin-top: 0.5rem;
  }

  .file-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }

  .empty-row td {
    text-align: center;
    padding: 2rem;
    color: var(--color-muted);
    font-style: italic;
    border-bottom: 1px solid var(--color-border-light);
  }

  @media (max-width: 480px) {
    .file-table {
      font-size: 0.85rem;
    }
  }
</style>
