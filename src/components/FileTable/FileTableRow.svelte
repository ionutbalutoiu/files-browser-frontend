<script lang="ts">
  import type { NginxEntry } from '../../lib/types';
  import { formatSize, formatDate } from '../../lib/format';
  import { getFileUrl, getDirectoryUrl } from '../../lib/api';

  interface Props {
    entry: NginxEntry;
    currentPath: string;
    isMenuOpen: boolean;
    isDeleting: boolean;
    isRenaming: boolean;
    renameValue: string;
    renameError: string | null;
    deleteError: string | null;
    isSubmitting: boolean;
    onNavigate: (path: string) => void;
    onMenuToggle: (entryName: string, event: MouseEvent) => void;
    onRenameChange: (value: string) => void;
    onRenameConfirm: () => void;
    onRenameCancel: () => void;
  }

  let {
    entry,
    currentPath,
    isMenuOpen,
    isDeleting,
    isRenaming,
    renameValue,
    renameError,
    deleteError,
    isSubmitting,
    onNavigate,
    onMenuToggle,
    onRenameChange,
    onRenameConfirm,
    onRenameCancel,
  }: Props = $props();

  let renameInputRef = $state<HTMLInputElement | null>(null);

  function getIcon(type: 'file' | 'directory'): string {
    return type === 'directory' ? '📁' : '📄';
  }

  function handleDirectoryClick(event: MouseEvent) {
    event.preventDefault();
    const newPath = getDirectoryUrl(currentPath, entry.name);
    onNavigate(newPath);
  }

  function handleKeydown(event: KeyboardEvent) {
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

  function handleMenuKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onMenuToggle(entry.name, event as unknown as MouseEvent);
    }
  }

  function handleRenameKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      onRenameConfirm();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onRenameCancel();
    }
  }

  function handleRenameBlur(event: FocusEvent) {
    const relatedTarget = event.relatedTarget as HTMLElement | null;
    if (relatedTarget?.closest('.rename-actions')) {
      return;
    }
    setTimeout(() => {
      if (isRenaming && !isSubmitting) {
        onRenameCancel();
      }
    }, 150);
  }

  // Focus input when rename mode activates
  $effect(() => {
    if (isRenaming && renameInputRef) {
      renameInputRef.focus();
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
  });
</script>

<tr
  class="file-row"
  class:directory={entry.type === 'directory'}
  class:has-error={deleteError !== null}
  tabindex="0"
  onkeydown={handleKeydown}
>
  <td class="col-name">
    <span class="icon" aria-hidden="true">{getIcon(entry.type)}</span>
    {#if isRenaming}
      <div class="rename-container">
        <div class="rename-input-row">
          <input
            type="text"
            class="rename-input"
            class:has-error={renameError !== null}
            value={renameValue}
            oninput={(e) => onRenameChange(e.currentTarget.value)}
            bind:this={renameInputRef}
            disabled={isSubmitting}
            onkeydown={handleRenameKeydown}
            onblur={handleRenameBlur}
            aria-label="New name for {entry.name}"
          />
          <div class="rename-actions">
            <button
              type="button"
              class="rename-action-btn confirm"
              onclick={onRenameConfirm}
              disabled={isSubmitting || !renameValue.trim()}
              aria-label="Confirm rename"
            >
              {isSubmitting ? '...' : '✓'}
            </button>
            <button
              type="button"
              class="rename-action-btn cancel"
              onclick={onRenameCancel}
              disabled={isSubmitting}
              aria-label="Cancel rename"
            >
              ✕
            </button>
          </div>
        </div>
        {#if renameError}
          <span class="rename-error" role="alert">{renameError}</span>
        {/if}
      </div>
    {:else if entry.type === 'directory'}
      <a
        href="#{getDirectoryUrl(currentPath, entry.name)}"
        onclick={handleDirectoryClick}
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
    {#if deleteError}
      <span class="delete-error" role="alert">{deleteError}</span>
    {/if}
    {#if renameError && !isRenaming}
      <span class="rename-error" role="alert">{renameError}</span>
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
        class:active={isMenuOpen}
        onclick={(e) => onMenuToggle(entry.name, e)}
        onkeydown={handleMenuKeydown}
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        aria-label="Actions for {entry.name}"
        disabled={isDeleting}
      >
        {#if isDeleting}
          <span class="spinner-small"></span>
        {:else}
          ⋮
        {/if}
      </button>
    </div>
  </td>
</tr>

<style>
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

  td {
    padding: 0.6rem 1rem;
    border-bottom: 1px solid var(--color-border-light);
    vertical-align: middle;
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
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 768px) {
    td {
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

  @media (max-width: 480px) {
    td {
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
</style>
