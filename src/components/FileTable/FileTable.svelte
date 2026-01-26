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
  import { moveFile, buildMovePath } from "../../lib/api"
  import { getParentPath } from "../../lib/url"
  import { showToast } from "../../lib/stores/toast.svelte"
  import FileTableHeader from "./FileTableHeader.svelte"
  import FileTableRow from "./FileTableRow.svelte"
  import ActionMenu from "./ActionMenu.svelte"
  import ConfirmDialog from "../shared/ConfirmDialog.svelte"

  interface Props {
    entries: NginxEntry[]
    currentPath: string
    sort: SortState
    isSelectionMode: boolean
    selectedEntries: Set<string>
    onNavigate: (path: string) => void
    onSortChange: (field: SortField) => void
    onDelete: () => void
    onRefresh: () => void
    onSelectionModeChange: (mode: boolean) => void
    onSelectedEntriesChange: (entries: Set<string>) => void
  }

  let {
    entries,
    currentPath,
    sort,
    isSelectionMode,
    selectedEntries,
    onNavigate,
    onSortChange,
    onDelete,
    onRefresh,
    onSelectionModeChange,
    onSelectedEntriesChange,
  }: Props = $props()

  // Drag and drop state
  let draggedEntry = $state<NginxEntry | null>(null)
  let dropTargetEntry = $state<NginxEntry | null>(null)

  // Parent directory entry (shown when not at root)
  const parentEntry: NginxEntry = { name: "..", type: "directory" }

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

  // Drag and drop handlers
  function handleDragStart(entry: NginxEntry) {
    draggedEntry = entry
  }

  function handleDragEnd() {
    draggedEntry = null
    dropTargetEntry = null
  }

  function handleDragEnter(targetEntry: NginxEntry) {
    // Don't allow dropping onto itself
    if (draggedEntry?.name === targetEntry.name) return

    // Don't allow dropping a directory into itself (same name check)
    if (
      draggedEntry?.type === "directory" &&
      draggedEntry.name === targetEntry.name
    )
      return

    dropTargetEntry = targetEntry
  }

  function handleDragLeave(targetEntry: NginxEntry) {
    // Only clear if we're leaving the current drop target
    // This prevents clearing when dragenter on new row fires before dragleave on old row
    if (dropTargetEntry?.name === targetEntry.name) {
      dropTargetEntry = null
    }
  }

  async function handleDrop(targetEntry: NginxEntry) {
    if (!draggedEntry) return

    // Don't allow dropping onto itself
    if (draggedEntry.name === targetEntry.name) {
      handleDragEnd()
      return
    }

    // Build source and destination paths
    const sourcePath = buildMovePath(currentPath, draggedEntry.name)

    let destDir: string
    let destPath: string
    let targetName: string

    if (targetEntry.name === "..") {
      // Moving to parent directory
      destDir = getParentPath(currentPath)
      destPath = buildMovePath(destDir, draggedEntry.name)
      targetName = "parent folder"
    } else {
      // Moving to a subdirectory
      destDir = buildMovePath(currentPath, targetEntry.name)
      destPath = buildMovePath(destDir, draggedEntry.name)
      targetName = targetEntry.name
    }

    const itemName = draggedEntry.name

    // Clear drag state before async operation
    handleDragEnd()

    try {
      await moveFile(sourcePath, destPath)
      showToast(`Moved "${itemName}" to ${targetName}`, "success")
      onRefresh()
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? (error as { message: string }).message
          : "Move failed"
      showToast(message, "error")
    }
  }

  // Selection mode handlers
  function startSelectionMode(entry: NginxEntry) {
    onSelectionModeChange(true)
    onSelectedEntriesChange(new Set([entry.name]))
    // Close any open menu
    storeToggleMenu("", {} as MouseEvent)
  }

  function cancelSelectionMode() {
    onSelectionModeChange(false)
    onSelectedEntriesChange(new Set())
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && isSelectionMode) {
      cancelSelectionMode()
    }
  }

  function toggleSelectEntry(entry: NginxEntry) {
    const newSelected = new Set(selectedEntries)
    if (newSelected.has(entry.name)) {
      newSelected.delete(entry.name)
    } else {
      newSelected.add(entry.name)
    }
    onSelectedEntriesChange(newSelected)

    // If no items selected, exit selection mode
    if (newSelected.size === 0) {
      onSelectionModeChange(false)
    }
  }

  async function moveSelectedToDirectory(targetEntry: NginxEntry) {
    if (selectedEntries.size === 0) return

    let destDir: string
    let targetName: string

    if (targetEntry.name === "..") {
      destDir = getParentPath(currentPath)
      targetName = "parent folder"
    } else {
      destDir = buildMovePath(currentPath, targetEntry.name)
      targetName = targetEntry.name
    }

    const itemsToMove = [...selectedEntries]
    const moveCount = itemsToMove.length

    // Exit selection mode before moving
    cancelSelectionMode()

    let successCount = 0
    let errorCount = 0
    let lastErrorMessage = ""

    for (const itemName of itemsToMove) {
      const sourcePath = buildMovePath(currentPath, itemName)
      const destPath = buildMovePath(destDir, itemName)

      try {
        await moveFile(sourcePath, destPath)
        successCount++
      } catch (error) {
        errorCount++
        if (error && typeof error === "object" && "message" in error) {
          const msg = (error as { message: string }).message
          lastErrorMessage = msg.charAt(0).toUpperCase() + msg.slice(1)
        }
      }
    }

    if (errorCount === 0) {
      showToast(
        `Moved ${moveCount} item${moveCount > 1 ? "s" : ""} to ${targetName}`,
        "success",
      )
    } else if (successCount > 0) {
      showToast(
        `Moved ${successCount} item${successCount > 1 ? "s" : ""}, ${errorCount} failed`,
        "error",
      )
    } else {
      showToast(lastErrorMessage || "Move failed", "error")
    }

    onRefresh()
  }

  // Derived values for menu display
  let currentMenuEntry = $derived(
    getOpenMenu() ? entries.find((e) => e.name === getOpenMenu()) : null,
  )
  let currentMenuPosition = $derived(getMenuPosition())
</script>

<svelte:document onclick={handleDocumentClick} onkeydown={handleKeydown} />

<div class="table-container">
  <table class="file-table" role="grid">
    <FileTableHeader {sort} {onSortChange} />
    <tbody>
      {#if currentPath !== "/" && currentPath !== ""}
        <FileTableRow
          entry={parentEntry}
          {currentPath}
          isMenuOpen={false}
          isDeleting={false}
          isRenaming={false}
          renameValue=""
          renameError={null}
          deleteError={null}
          isSubmitting={false}
          isDragging={false}
          isDropTarget={dropTargetEntry?.name === ".."}
          isParentEntry={true}
          {isSelectionMode}
          isSelected={false}
          {onNavigate}
          onMenuToggle={() => {}}
          onRenameChange={() => {}}
          onRenameConfirm={() => {}}
          onRenameCancel={() => {}}
          onDragStart={() => {}}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onMoveHere={moveSelectedToDirectory}
        />
      {/if}
      {#if entries.length === 0 && (currentPath === "/" || currentPath === "")}
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
            isDragging={draggedEntry?.name === entry.name}
            isDropTarget={dropTargetEntry?.name === entry.name}
            {isSelectionMode}
            isSelected={selectedEntries.has(entry.name)}
            {onNavigate}
            onMenuToggle={toggleMenu}
            onRenameChange={setRenameValue}
            onRenameConfirm={() => handleConfirmRename(entry.name)}
            onRenameCancel={cancelRename}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onToggleSelect={toggleSelectEntry}
            onMoveHere={moveSelectedToDirectory}
            onLongPress={startSelectionMode}
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
    onSelect={startSelectionMode}
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
