<script lang="ts">
  import type { NginxEntry, SortField, SortState } from '../../lib/types';
  import {
    deleteFile,
    getDeletePath,
    renameFile,
    sharePublic,
  } from '../../lib/upload';
  import type {
    DeleteError,
    RenameError,
    SharePublicError,
  } from '../../lib/types';
  import FileTableHeader from './FileTableHeader.svelte';
  import FileTableRow from './FileTableRow.svelte';
  import ActionMenu from './ActionMenu.svelte';
  import ConfirmDialog from '../shared/ConfirmDialog.svelte';
  import Toast from '../shared/Toast.svelte';

  interface Props {
    entries: NginxEntry[];
    currentPath: string;
    sort: SortState;
    onNavigate: (path: string) => void;
    onSortChange: (field: SortField) => void;
    onDelete: () => void;
  }

  let { entries, currentPath, sort, onNavigate, onSortChange, onDelete }: Props =
    $props();

  // Menu state
  let openMenu = $state<string | null>(null);
  let menuPosition = $state<{
    top: number;
    left: number;
    openUpward: boolean;
  } | null>(null);

  // Delete state
  let deleting = $state<string | null>(null);
  let deleteError = $state<{ name: string; message: string } | null>(null);
  let confirmEntry = $state<NginxEntry | null>(null);

  // Rename state
  let renamingEntry = $state<string | null>(null);
  let renameValue = $state('');
  let renameError = $state<{ name: string; message: string } | null>(null);
  let renaming = $state(false);

  // Share state
  let sharing = $state<string | null>(null);

  // Toast notification state
  let toast = $state<{ message: string; type: 'success' | 'error' } | null>(
    null
  );
  let toastTimeout: ReturnType<typeof setTimeout> | null = null;

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
    toast = { message, type };
    toastTimeout = setTimeout(() => {
      toast = null;
      toastTimeout = null;
    }, 4000);
  }

  function dismissToast() {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
      toastTimeout = null;
    }
    toast = null;
  }

  // Menu handlers
  function toggleMenu(entryName: string, event: MouseEvent) {
    event.stopPropagation();
    if (openMenu === entryName) {
      closeMenu();
    } else {
      openMenu = entryName;
      deleteError = null;
      const trigger = event.currentTarget as HTMLButtonElement;
      if (trigger) {
        const rect = trigger.getBoundingClientRect();
        const menuHeight = 132; // 3 items * ~44px
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom;
        const openUpward = spaceBelow < menuHeight + 8;

        menuPosition = {
          top: openUpward ? rect.top : rect.bottom,
          left: rect.right,
          openUpward,
        };
      }
    }
  }

  function closeMenu() {
    openMenu = null;
    menuPosition = null;
  }

  function handleDocumentClick() {
    if (openMenu) {
      closeMenu();
    }
  }

  // Delete handlers
  function requestDelete(entry: NginxEntry) {
    closeMenu();
    confirmEntry = entry;
  }

  function cancelDelete() {
    confirmEntry = null;
  }

  async function confirmDeleteAction() {
    if (!confirmEntry) return;

    const entry = confirmEntry;
    confirmEntry = null;
    deleting = entry.name;
    deleteError = null;

    try {
      const path = getDeletePath(currentPath, entry.name);
      await deleteFile(path);
      onDelete();
    } catch (err) {
      deleteError = {
        name: entry.name,
        message: (err as DeleteError).message,
      };
    } finally {
      deleting = null;
    }
  }

  // Share handler
  async function handleShare(entry: NginxEntry) {
    closeMenu();

    if (entry.type === 'directory') {
      return;
    }

    sharing = entry.name;

    try {
      const path = getDeletePath(currentPath, entry.name);
      const result = await sharePublic(path);
      showToast(`File shared publicly: ${result.shared}`, 'success');
    } catch (err) {
      const error = err as SharePublicError;
      showToast(error.message, 'error');
    } finally {
      sharing = null;
    }
  }

  // Rename handlers
  function startRename(entry: NginxEntry) {
    closeMenu();
    renameError = null;
    renamingEntry = entry.name;
    renameValue = entry.name;
  }

  function cancelRename() {
    renamingEntry = null;
    renameValue = '';
    renameError = null;
  }

  function validateRename(name: string, originalName: string): string | null {
    const trimmed = name.trim();
    if (!trimmed) {
      return 'Name cannot be empty';
    }
    if (trimmed.includes('/') || trimmed.includes('\\')) {
      return 'Name cannot contain / or \\';
    }
    if (trimmed === originalName) {
      return null; // No change, silently cancel
    }
    return ''; // Valid
  }

  async function confirmRename(originalName: string) {
    const trimmedName = renameValue.trim();
    const validationResult = validateRename(trimmedName, originalName);

    if (validationResult === null) {
      cancelRename();
      return;
    }

    if (validationResult) {
      renameError = { name: originalName, message: validationResult };
      return;
    }

    renaming = true;

    try {
      const oldPath = getDeletePath(currentPath, originalName);
      await renameFile(oldPath, trimmedName);
      const entryIndex = entries.findIndex((e) => e.name === originalName);
      if (entryIndex !== -1) {
        entries[entryIndex] = { ...entries[entryIndex], name: trimmedName };
        entries = [...entries];
      }
      renameError = null;
      renamingEntry = null;
    } catch (err) {
      renameError = {
        name: originalName,
        message: (err as RenameError).message,
      };
    } finally {
      renaming = false;
    }
  }

  // Get current entry for menu
  let currentMenuEntry = $derived(
    openMenu ? entries.find((e) => e.name === openMenu) : null
  );
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
            isDeleting={deleting === entry.name}
            isRenaming={renamingEntry === entry.name}
            {renameValue}
            renameError={renameError?.name === entry.name
              ? renameError.message
              : null}
            deleteError={deleteError?.name === entry.name
              ? deleteError.message
              : null}
            isSubmitting={renaming}
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
    isSharing={sharing === currentMenuEntry.name}
    onShare={handleShare}
    onRename={startRename}
    onDelete={requestDelete}
  />
{/if}

<!-- Confirmation Dialog -->
{#if confirmEntry}
  <ConfirmDialog
    title={confirmEntry.type === 'directory' ? 'Delete Folder' : 'Delete File'}
    confirmLabel="Delete"
    variant="danger"
    onConfirm={confirmDeleteAction}
    onCancel={cancelDelete}
  >
    {#if confirmEntry.type === 'directory'}
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

<!-- Toast Notification -->
{#if toast}
  <Toast message={toast.message} type={toast.type} onDismiss={dismissToast} />
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
