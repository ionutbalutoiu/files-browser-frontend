<script lang="ts">
  import type { NginxEntry } from '../lib/nginxAutoindex';
  import type { SortField, SortState } from '../lib/sortFilter';
  import { formatSize, formatDate } from '../lib/format';
  import { getFileUrl, getDirectoryUrl } from '../lib/api';
  import { deleteFile, getDeletePath, renameFile, type DeleteError, type RenameError } from '../lib/upload';

  interface Props {
    entries: NginxEntry[];
    currentPath: string;
    sort: SortState;
    onNavigate: (path: string) => void;
    onSortChange: (field: SortField) => void;
    onDelete: () => void;
  }

  let { entries, currentPath, sort, onNavigate, onSortChange, onDelete }: Props = $props();

  // Track which menu is open (by entry name)
  let openMenu = $state<string | null>(null);
  let deleting = $state<string | null>(null);
  let deleteError = $state<{ name: string; message: string } | null>(null);

  // Confirmation dialog state
  let confirmEntry = $state<NginxEntry | null>(null);

  // Rename state
  let renamingEntry = $state<string | null>(null);
  let renameValue = $state('');
  let renameError = $state<{ name: string; message: string } | null>(null);
  let renameInputRef = $state<HTMLInputElement | null>(null);
  let renaming = $state(false);

  // Menu positioning state
  let menuPosition = $state<{ top: number; left: number; openUpward: boolean } | null>(null);

  function handleDirectoryClick(entry: NginxEntry, event: MouseEvent) {
    event.preventDefault();
    const newPath = getDirectoryUrl(currentPath, entry.name);
    onNavigate(newPath);
  }

  function handleKeydown(entry: NginxEntry, event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (entry.type === 'directory') {
        const newPath = getDirectoryUrl(currentPath, entry.name);
        onNavigate(newPath);
      } else {
        window.open(getFileUrl(currentPath, entry.name), '_blank');
      }
    }
  }

  function getIcon(type: 'file' | 'directory'): string {
    return type === 'directory' ? '📁' : '📄';
  }

  function getSortIndicator(field: SortField): string {
    if (sort.field !== field) return '';
    return sort.direction === 'asc' ? ' ↑' : ' ↓';
  }

  function handleHeaderClick(field: SortField) {
    onSortChange(field);
  }

  function handleHeaderKeydown(field: SortField, event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSortChange(field);
    }
  }

  function toggleMenu(entryName: string, event: MouseEvent) {
    event.stopPropagation();
    if (openMenu === entryName) {
      openMenu = null;
      menuPosition = null;
    } else {
      openMenu = entryName;
      deleteError = null;
      // Calculate position from trigger button
      const trigger = event.currentTarget as HTMLButtonElement;
      if (trigger) {
        const rect = trigger.getBoundingClientRect();
        const menuHeight = 88; // Approximate height of menu (2 items * ~44px each)
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom;
        const openUpward = spaceBelow < menuHeight + 8;
        
        menuPosition = {
          top: openUpward ? rect.top : rect.bottom,
          left: rect.right,
          openUpward
        };
      }
    }
  }

  function closeMenu() {
    openMenu = null;
    menuPosition = null;
  }

  function handleMenuKeydown(entryName: string, event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      openMenu = openMenu === entryName ? null : entryName;
    } else if (event.key === 'Escape') {
      openMenu = null;
    }
  }

  function requestDelete(entry: NginxEntry) {
    openMenu = null;
    confirmEntry = entry;
  }

  function cancelDelete() {
    confirmEntry = null;
  }

  function handleDialogKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      cancelDelete();
    }
  }

  async function confirmDelete() {
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

  // Rename functions
  function startRename(entry: NginxEntry) {
    openMenu = null;
    renameError = null;
    renamingEntry = entry.name;
    renameValue = entry.name;
    // Focus and select filename (not extension) after DOM updates
    setTimeout(() => {
      if (renameInputRef) {
        renameInputRef.focus();
        // Select only the filename part (not extension) for files
        if (entry.type === 'file') {
          const lastDot = entry.name.lastIndexOf('.');
          if (lastDot > 0) {
            renameInputRef.setSelectionRange(0, lastDot);
          } else {
            renameInputRef.select();
          }
        } else {
          renameInputRef.select();
        }
      }
    }, 0);
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
      // Name didn't change, just cancel
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
      // Update the entry in the local state
      const entryIndex = entries.findIndex((e) => e.name === originalName);
      if (entryIndex !== -1) {
        entries[entryIndex] = { ...entries[entryIndex], name: trimmedName };
        entries = [...entries]; // Trigger reactivity
      }
      renameError = null;
      renamingEntry = null;
    } catch (err) {
      renameError = {
        name: originalName,
        message: (err as RenameError).message,
      };
      console.error('Rename failed:', err);
    } finally {
      renaming = false;
    }
  }

  function handleRenameKeydown(originalName: string, event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      confirmRename(originalName);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelRename();
    }
  }

  function handleRenameBlur(originalName: string, event: FocusEvent) {
    // Check if focus is moving to one of the action buttons
    const relatedTarget = event.relatedTarget as HTMLElement | null;
    if (relatedTarget?.closest('.rename-actions')) {
      return; // Don't cancel if clicking action buttons
    }
    // Small delay to allow click events to process first
    setTimeout(() => {
      if (renamingEntry === originalName && !renaming) {
        cancelRename();
      }
    }, 150);
  }

  // Close menu when clicking outside
  function handleDocumentClick() {
    if (openMenu) {
      openMenu = null;
    }
  }
</script>

<svelte:document onclick={handleDocumentClick} />

<div class="table-container">
  <table class="file-table" role="grid">
    <thead>
      <tr>
        <th 
          scope="col" 
          class="col-name sortable"
          class:sorted={sort.field === 'name'}
          onclick={() => handleHeaderClick('name')}
          onkeydown={(e) => handleHeaderKeydown('name', e)}
          tabindex="0"
          role="columnheader"
          aria-sort={sort.field === 'name' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
        >
          Name{getSortIndicator('name')}
        </th>
        <th 
          scope="col" 
          class="col-size sortable"
          class:sorted={sort.field === 'size'}
          onclick={() => handleHeaderClick('size')}
          onkeydown={(e) => handleHeaderKeydown('size', e)}
          tabindex="0"
          role="columnheader"
          aria-sort={sort.field === 'size' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
        >
          Size{getSortIndicator('size')}
        </th>
        <th 
          scope="col" 
          class="col-modified sortable"
          class:sorted={sort.field === 'mtime'}
          onclick={() => handleHeaderClick('mtime')}
          onkeydown={(e) => handleHeaderKeydown('mtime', e)}
          tabindex="0"
          role="columnheader"
          aria-sort={sort.field === 'mtime' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
        >
          Modified{getSortIndicator('mtime')}
        </th>
        <th scope="col" class="col-actions">
          <span class="visually-hidden">Actions</span>
        </th>
      </tr>
    </thead>
    <tbody>
      {#if entries.length === 0}
        <tr class="empty-row">
          <td colspan="4">No files found</td>
        </tr>
      {:else}
        {#each entries as entry (entry.name)}
          <tr 
            class="file-row" 
            class:directory={entry.type === 'directory'}
            class:has-error={deleteError?.name === entry.name}
            tabindex="0"
            onkeydown={(e) => handleKeydown(entry, e)}
          >
            <td class="col-name">
              <span class="icon" aria-hidden="true">{getIcon(entry.type)}</span>
              {#if renamingEntry === entry.name}
                <div class="rename-container">
                  <div class="rename-input-row">
                    <input
                      type="text"
                      class="rename-input"
                      class:has-error={renameError?.name === entry.name}
                      bind:value={renameValue}
                      bind:this={renameInputRef}
                      disabled={renaming}
                      onkeydown={(e) => handleRenameKeydown(entry.name, e)}
                      onblur={(e) => handleRenameBlur(entry.name, e)}
                      aria-label="New name for {entry.name}"
                    />
                    <div class="rename-actions">
                      <button
                        type="button"
                        class="rename-action-btn confirm"
                        onclick={() => confirmRename(entry.name)}
                        disabled={renaming || !renameValue.trim()}
                        aria-label="Confirm rename"
                      >
                        {renaming ? '...' : '✓'}
                      </button>
                      <button
                        type="button"
                        class="rename-action-btn cancel"
                        onclick={cancelRename}
                        disabled={renaming}
                        aria-label="Cancel rename"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  {#if renameError?.name === entry.name}
                    <span class="rename-error" role="alert">{renameError.message}</span>
                  {/if}
                </div>
              {:else if entry.type === 'directory'}
                <a 
                  href="#{getDirectoryUrl(currentPath, entry.name)}"
                  onclick={(e) => handleDirectoryClick(entry, e)}
                  class="entry-link"
                >
                  {entry.name}
                </a>
              {:else}
                <a 
                  href={getFileUrl(currentPath, entry.name)}
                  target="_blank"
                  rel="noopener"
                  class="entry-link"
                >
                  {entry.name}
                </a>
              {/if}
              {#if deleteError?.name === entry.name}
                <span class="delete-error" role="alert">{deleteError.message}</span>
              {/if}
              {#if renameError?.name === entry.name && renamingEntry !== entry.name}
                <span class="rename-error" role="alert">{renameError.message}</span>
              {/if}
            </td>
            <td class="col-size">
              {entry.type === 'directory' ? '—' : formatSize(entry.size)}
            </td>
            <td class="col-modified">
              <span class="date-full">{formatDate(entry.mtime)}</span>
            </td>
            <td class="col-actions">
              <div class="action-menu">
                <button
                  type="button"
                  class="menu-trigger"
                  class:active={openMenu === entry.name}
                  onclick={(e) => toggleMenu(entry.name, e)}
                  onkeydown={(e) => handleMenuKeydown(entry.name, e)}
                  aria-haspopup="menu"
                  aria-expanded={openMenu === entry.name}
                  aria-label="Actions for {entry.name}"
                  disabled={deleting === entry.name}
                >
                  {#if deleting === entry.name}
                    <span class="spinner-small"></span>
                  {:else}
                    ⋮
                  {/if}
                </button>
              </div>
            </td>
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>

<!-- Context Menu Portal - Rendered outside table to avoid overflow clipping -->
{#if openMenu && menuPosition}
  {@const currentEntry = entries.find(e => e.name === openMenu)}
  {#if currentEntry}
    <div 
      class="menu-dropdown"
      class:open-upward={menuPosition.openUpward}
      role="menu"
      style="top: {menuPosition.top}px; left: {menuPosition.left}px;"
    >
      <button
        type="button"
        class="menu-item"
        onclick={() => startRename(currentEntry)}
        role="menuitem"
      >
        ✏️ Rename
      </button>
      <button
        type="button"
        class="menu-item delete"
        onclick={() => requestDelete(currentEntry)}
        role="menuitem"
      >
        🗑️ Delete
      </button>
    </div>
  {/if}
{/if}

<!-- Confirmation Dialog -->
{#if confirmEntry}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div 
    class="dialog-overlay" 
    onclick={cancelDelete}
    onkeydown={handleDialogKeydown}
    role="presentation"
  >
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div 
      class="dialog" 
      role="alertdialog" 
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
      tabindex="0"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <h2 id="dialog-title" class="dialog-title">
        {confirmEntry.type === 'directory' ? 'Delete Folder' : 'Delete File'}
      </h2>
      <p id="dialog-description" class="dialog-message">
        {#if confirmEntry.type === 'directory'}
          Delete folder <strong>"{confirmEntry.name}"</strong>? It must be empty.
        {:else}
          Delete <strong>"{confirmEntry.name}"</strong>? This cannot be undone.
        {/if}
      </p>
      <div class="dialog-actions">
        <button 
          type="button" 
          class="dialog-btn cancel" 
          onclick={cancelDelete}
        >
          Cancel
        </button>
        <button 
          type="button" 
          class="dialog-btn confirm" 
          onclick={confirmDelete}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
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

  thead {
    position: sticky;
    top: 0;
    background: var(--color-bg);
    z-index: 1;
  }

  th {
    text-align: left;
    padding: 0.75rem 1rem;
    font-weight: 600;
    color: var(--color-text);
    border-bottom: 2px solid var(--color-border);
    white-space: nowrap;
    user-select: none;
  }

  th.sortable {
    cursor: pointer;
    transition: background-color 0.15s;
  }

  th.sortable:hover {
    background: var(--color-hover);
  }

  th.sortable:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: -2px;
  }

  th.sorted {
    color: var(--color-link);
  }

  td {
    padding: 0.6rem 1rem;
    border-bottom: 1px solid var(--color-border-light);
    vertical-align: middle;
  }

  .file-row {
    transition: background-color 0.1s;
  }

  .file-row:hover {
    background: var(--color-hover);
  }

  .file-row:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: -2px;
  }

  .file-row.directory {
    font-weight: 500;
  }

  .file-row.has-error {
    background: var(--color-error-bg, rgba(220, 53, 69, 0.1));
  }

  .col-name {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 200px;
    flex-wrap: wrap;
  }

  .icon {
    flex-shrink: 0;
    font-size: 1.1rem;
  }

  .entry-link {
    color: var(--color-link);
    text-decoration: none;
    word-break: break-word;
  }

  .entry-link:hover {
    text-decoration: underline;
  }

  .entry-link:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .delete-error {
    flex-basis: 100%;
    font-size: 0.8rem;
    color: var(--color-error, #dc3545);
    margin-top: 0.25rem;
    padding-left: 1.6rem;
  }

  .rename-container {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }

  .rename-input-row {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .rename-input {
    flex: 1;
    padding: 0.25rem 0.5rem;
    font-size: inherit;
    font-family: inherit;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-bg);
    color: var(--color-text);
    outline: none;
    min-width: 100px;
  }

  .rename-input:focus {
    border-color: var(--color-focus);
    box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.2);
  }

  .rename-input.has-error {
    border-color: var(--color-error, #dc3545);
  }

  .rename-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .rename-actions {
    display: flex;
    gap: 0.25rem;
  }

  .rename-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    font-size: 0.85rem;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-bg);
    color: var(--color-text);
    cursor: pointer;
    transition: all 0.15s;
  }

  .rename-action-btn:hover:not(:disabled) {
    background: var(--color-hover);
  }

  .rename-action-btn:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .rename-action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .rename-action-btn.confirm {
    color: var(--color-success, #28a745);
    border-color: var(--color-success, #28a745);
  }

  .rename-action-btn.confirm:hover:not(:disabled) {
    background: rgba(40, 167, 69, 0.1);
  }

  .rename-action-btn.cancel {
    color: var(--color-muted);
  }

  .rename-error {
    font-size: 0.75rem;
    color: var(--color-error, #dc3545);
    margin-top: 0.2rem;
  }

  .col-size {
    white-space: nowrap;
    color: var(--color-muted);
    min-width: 80px;
  }

  .col-modified {
    white-space: nowrap;
    color: var(--color-muted);
    min-width: 150px;
  }

  .col-actions {
    width: 48px;
    text-align: center;
    padding: 0.4rem;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .action-menu {
    position: relative;
    display: inline-block;
  }

  .menu-trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--color-muted);
    font-size: 1.2rem;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.15s, color 0.15s;
  }

  .menu-trigger:hover {
    background: var(--color-hover);
    color: var(--color-text);
  }

  .menu-trigger:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .menu-trigger.active {
    background: var(--color-hover);
    color: var(--color-text);
  }

  .menu-trigger:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .spinner-small {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid var(--color-border);
    border-top-color: var(--color-link);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .menu-dropdown {
    position: fixed;
    min-width: 120px;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    overflow: hidden;
    transform: translateX(-100%);
  }

  .menu-dropdown.open-upward {
    transform: translateX(-100%) translateY(-100%);
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.6rem 0.75rem;
    border: none;
    background: transparent;
    color: var(--color-text);
    font-size: 0.85rem;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.15s;
  }

  .menu-item:hover {
    background: var(--color-hover);
  }

  .menu-item:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: -2px;
  }

  .menu-item.delete {
    color: var(--color-error, #dc3545);
  }

  .menu-item.delete:hover {
    background: var(--color-error-bg, rgba(220, 53, 69, 0.1));
  }

  .empty-row td {
    text-align: center;
    padding: 2rem;
    color: var(--color-muted);
    font-style: italic;
  }

  /* Tablet breakpoint */
  @media (max-width: 768px) {
    th, td {
      padding: 0.6rem 0.75rem;
    }

    .col-modified {
      display: none;
    }

    .col-name {
      min-width: 150px;
    }

    .col-actions {
      width: 40px;
    }
  }

  /* Mobile breakpoint */
  @media (max-width: 480px) {
    .file-table {
      font-size: 0.85rem;
    }

    th, td {
      padding: 0.75rem 0.5rem;
    }

    .col-name {
      min-width: 120px;
      gap: 0.4rem;
    }

    .col-size {
      min-width: 55px;
      font-size: 0.8rem;
    }

    .icon {
      font-size: 1rem;
    }

    /* Better touch targets */
    .file-row {
      min-height: 44px;
    }

    .entry-link {
      padding: 0.25rem 0;
      display: inline-block;
    }

    .menu-trigger {
      width: 40px;
      height: 40px;
    }
  }

  /* ===================================
     Confirmation Dialog
     =================================== */

  .dialog-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
    animation: fadeIn 0.15s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .dialog {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    max-width: 400px;
    width: 100%;
    padding: 1.5rem;
    animation: slideIn 0.15s ease-out;
  }

  @keyframes slideIn {
    from { 
      opacity: 0;
      transform: scale(0.95) translateY(-10px);
    }
    to { 
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .dialog-title {
    margin: 0 0 0.75rem 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .dialog-message {
    margin: 0 0 1.5rem 0;
    font-size: 0.95rem;
    color: var(--color-muted);
    line-height: 1.5;
  }

  .dialog-message strong {
    color: var(--color-text);
    font-weight: 600;
    word-break: break-word;
  }

  .dialog-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
  }

  .dialog-btn {
    padding: 0.6rem 1.25rem;
    font-size: 0.9rem;
    font-weight: 500;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.15s, border-color 0.15s;
  }

  .dialog-btn:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .dialog-btn.cancel {
    background: transparent;
    border: 1px solid var(--color-border);
    color: var(--color-text);
  }

  .dialog-btn.cancel:hover {
    background: var(--color-hover);
    border-color: var(--color-border-hover);
  }

  .dialog-btn.confirm {
    background: var(--color-error, #dc3545);
    border: 1px solid var(--color-error, #dc3545);
    color: white;
  }

  .dialog-btn.confirm:hover {
    background: #c82333;
    border-color: #c82333;
  }

  /* Mobile dialog adjustments */
  @media (max-width: 480px) {
    .dialog {
      padding: 1.25rem;
    }

    .dialog-actions {
      flex-direction: column-reverse;
    }

    .dialog-btn {
      width: 100%;
      padding: 0.75rem;
    }
  }
</style>
