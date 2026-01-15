<script lang="ts">
  import type { NginxEntry, SortField, SortState } from "../../lib/types"
  import {
    // Menu state
    getOpenMenu,
    getMenuPosition,
    toggleMenu as storeToggleMenu,
    handleDocumentClick,
    // Delete state
    getDeletingEntry,
    getDeleteError,
    getConfirmEntry,
    clearDeleteError,
    requestDelete,
    cancelDelete,
    confirmDelete,
    // Rename state
    getRenamingEntry,
    getRenameValue,
    getRenameError,
    getIsSubmitting,
    setRenameValue,
    startRename,
    cancelRename,
    confirmRename,
    // Share state
    getSharingEntry,
    handleShare,
  } from "../../lib/stores/fileTable"
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

  // Wrap toggleMenu to also clear delete error
  function toggleMenu(entryName: string, event: MouseEvent) {
    clearDeleteError()
    storeToggleMenu(entryName, event)
  }

  // Wrap confirmDelete to pass currentPath and onDelete callback
  function handleConfirmDelete() {
    confirmDelete(currentPath, onDelete)
  }

  // Wrap confirmRename to pass currentPath and handle entry update
  function handleConfirmRename(originalName: string) {
    confirmRename(currentPath, originalName, (newName) => {
      const entryIndex = entries.findIndex((e) => e.name === originalName)
      if (entryIndex !== -1) {
        entries[entryIndex] = { ...entries[entryIndex], name: newName }
        entries = [...entries]
      }
    })
  }

  // Wrap handleShare to pass currentPath
  function onShare(entry: NginxEntry) {
    handleShare(entry, currentPath)
  }

  // Derived values for menu display
  let currentMenuEntry = $derived(
    getOpenMenu() ? entries.find((e) => e.name === getOpenMenu()) : null,
  )
  let currentMenuPosition = $derived(getMenuPosition())
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
            isMenuOpen={getOpenMenu() === entry.name}
            isDeleting={getDeletingEntry() === entry.name}
            isRenaming={getRenamingEntry() === entry.name}
            renameValue={getRenameValue()}
            renameError={getRenameError()?.name === entry.name
              ? (getRenameError()?.message ?? null)
              : null}
            deleteError={getDeleteError()?.name === entry.name
              ? (getDeleteError()?.message ?? null)
              : null}
            isSubmitting={getIsSubmitting()}
            {onNavigate}
            onMenuToggle={toggleMenu}
            onRenameChange={setRenameValue}
            onRenameConfirm={() => handleConfirmRename(entry.name)}
            onRenameCancel={cancelRename}
          />
        {/each}
      {/if}
    </tbody>
  </table>
</div>

<!-- Context Menu Portal -->
{#if currentMenuEntry && currentMenuPosition}
  <ActionMenu
    entry={currentMenuEntry}
    position={currentMenuPosition}
    isSharing={getSharingEntry() === currentMenuEntry.name}
    {onShare}
    onRename={startRename}
    onDelete={requestDelete}
  />
{/if}

<!-- Confirmation Dialog -->
{#if getConfirmEntry()}
  <ConfirmDialog
    title={getConfirmEntry()?.type === "directory"
      ? "Delete Folder"
      : "Delete File"}
    confirmLabel="Delete"
    variant="danger"
    onConfirm={handleConfirmDelete}
    onCancel={cancelDelete}
  >
    {#if getConfirmEntry()?.type === "directory"}
      <p>
        Delete folder <strong>"{getConfirmEntry()?.name}"</strong>? It must be
        empty.
      </p>
    {:else}
      <p>
        Delete <strong>"{getConfirmEntry()?.name}"</strong>? This cannot be
        undone.
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
