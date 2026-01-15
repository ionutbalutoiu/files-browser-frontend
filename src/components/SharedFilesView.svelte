<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import {
    listSharePublicFiles,
    deletePublicShare,
    type AppError,
  } from "../lib/api"
  import { navigateTo } from "../lib/router"
  import { getPublicFileUrl } from "../lib/config"
  import { COPY_FEEDBACK_TIMEOUT, DELETE_ERROR_TIMEOUT } from "../lib/constants"
  import { getFileName, getDirectoryPath } from "../lib/path"
  import { LoadingState, ErrorState, EmptyState, ConfirmDialog } from "./shared"

  // State
  let sharedFiles = $state<string[]>([])
  let copiedPath = $state<string | null>(null)
  let confirmPath = $state<string | null>(null)
  let deletingPath = $state<string | null>(null)
  let deleteError = $state<string | null>(null)
  let loading = $state(true)
  let error = $state<AppError | null>(null)

  // Timeout tracking for cleanup
  let copyTimeoutId: ReturnType<typeof setTimeout> | null = null
  let errorTimeoutId: ReturnType<typeof setTimeout> | null = null

  // Fetch shared files
  async function loadSharedFiles() {
    loading = true
    error = null
    sharedFiles = []

    try {
      sharedFiles = await listSharePublicFiles()
    } catch (e) {
      error = e as AppError
    } finally {
      loading = false
    }
  }

  // Navigate to file's parent directory
  function navigateToFile(filePath: string) {
    const dirPath = "/" + getDirectoryPath(filePath)
    navigateTo(dirPath)
  }

  // Copy public link to clipboard
  async function copyLink(filePath: string, event: MouseEvent) {
    event.stopPropagation()
    const url = getPublicFileUrl(filePath)
    try {
      await navigator.clipboard.writeText(url)
      copiedPath = filePath

      // Clear any existing timeout
      if (copyTimeoutId) {
        clearTimeout(copyTimeoutId)
      }

      // Reset after timeout
      copyTimeoutId = setTimeout(() => {
        if (copiedPath === filePath) {
          copiedPath = null
        }
        copyTimeoutId = null
      }, COPY_FEEDBACK_TIMEOUT)
    } catch (err) {
      console.error("Failed to copy link:", err)
    }
  }

  // Request unlink confirmation
  function requestUnlink(filePath: string, event: MouseEvent) {
    event.stopPropagation()
    confirmPath = filePath
  }

  // Cancel unlink confirmation
  function cancelUnlink() {
    confirmPath = null
  }

  // Confirm and execute unlink
  async function confirmUnlink() {
    if (!confirmPath) return

    const filePath = confirmPath
    confirmPath = null
    deletingPath = filePath
    deleteError = null

    // Clear any existing error timeout
    if (errorTimeoutId) {
      clearTimeout(errorTimeoutId)
      errorTimeoutId = null
    }

    try {
      await deletePublicShare(filePath)
      // Remove from local list for snappy UX
      sharedFiles = sharedFiles.filter((f) => f !== filePath)
    } catch (err) {
      deleteError = (err as AppError).message
      // Clear error after timeout
      errorTimeoutId = setTimeout(() => {
        deleteError = null
        errorTimeoutId = null
      }, DELETE_ERROR_TIMEOUT)
    } finally {
      deletingPath = null
    }
  }

  onMount(() => {
    loadSharedFiles()
  })

  onDestroy(() => {
    if (copyTimeoutId) clearTimeout(copyTimeoutId)
    if (errorTimeoutId) clearTimeout(errorTimeoutId)
  })
</script>

<div class="shared-files-view">
  <header class="view-header">
    <h2 class="view-title">
      <span class="title-icon" aria-hidden="true">🔗</span>
      Publicly Shared Files
    </h2>
    {#if !loading && !error}
      <button
        type="button"
        class="refresh-button"
        onclick={loadSharedFiles}
        aria-label="Refresh list"
      >
        ↻ Refresh
      </button>
    {/if}
  </header>

  {#if loading}
    <LoadingState message="Loading shared files..." />
  {:else if error}
    {#if error.notEnabled}
      <ErrorState icon="🚫" message={error.message}>
        The public sharing feature needs to be enabled in the server
        configuration.
      </ErrorState>
    {:else}
      <ErrorState icon="⚠️" message={error.message} onRetry={loadSharedFiles} />
    {/if}
  {:else if sharedFiles.length === 0}
    <EmptyState
      icon="📭"
      message="No files have been shared publicly"
      hint="Use the share button on any file to make it publicly accessible."
    />
  {:else}
    {#if deleteError}
      <div class="delete-error" role="alert">
        <span class="delete-error-icon" aria-hidden="true">⚠️</span>
        <span class="delete-error-message">{deleteError}</span>
        <button
          type="button"
          class="delete-error-dismiss"
          onclick={() => (deleteError = null)}
          aria-label="Dismiss error"
        >
          ✕
        </button>
      </div>
    {/if}
    <div class="file-list">
      <div class="list-header">
        <span class="header-count"
          >{sharedFiles.length} shared file{sharedFiles.length !== 1
            ? "s"
            : ""}</span
        >
      </div>
      <ul class="files" role="list">
        {#each sharedFiles as filePath}
          <li class="file-item">
            <div class="file-row">
              <button
                type="button"
                class="file-link"
                onclick={() => navigateToFile(filePath)}
                title="Navigate to file location"
              >
                <span class="file-icon" aria-hidden="true">📄</span>
                <span class="file-info">
                  <span class="file-name">{getFileName(filePath)}</span>
                  <span class="file-path">{getDirectoryPath(filePath)}</span>
                </span>
                <span class="navigate-icon" aria-hidden="true">→</span>
              </button>
              <div class="file-actions">
                <button
                  type="button"
                  class="copy-link-btn"
                  class:copied={copiedPath === filePath}
                  onclick={(e) => copyLink(filePath, e)}
                  title="Copy public link"
                >
                  {#if copiedPath === filePath}
                    <span class="btn-icon" aria-hidden="true">✓</span>
                    <span class="btn-text">Copied!</span>
                  {:else}
                    <span class="btn-icon" aria-hidden="true">🔗</span>
                    <span class="btn-text">Copy</span>
                  {/if}
                </button>
                <button
                  type="button"
                  class="unlink-btn"
                  class:deleting={deletingPath === filePath}
                  onclick={(e) => requestUnlink(filePath, e)}
                  disabled={deletingPath === filePath}
                  title="Remove public share"
                >
                  {#if deletingPath === filePath}
                    <span class="btn-icon spinner-small" aria-hidden="true"
                    ></span>
                    <span class="btn-text">Removing...</span>
                  {:else}
                    <span class="btn-icon" aria-hidden="true">🗑️</span>
                    <span class="btn-text">Remove</span>
                  {/if}
                </button>
              </div>
            </div>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>

<!-- Confirmation Dialog -->
{#if confirmPath}
  <ConfirmDialog
    title="Remove Public Share"
    confirmLabel="Remove"
    variant="danger"
    onConfirm={confirmUnlink}
    onCancel={cancelUnlink}
  >
    <p>
      Remove public share for <strong>"{confirmPath}"</strong>?
    </p>
    <p>The file will no longer be accessible via its public link.</p>
  </ConfirmDialog>
{/if}

<style>
  .shared-files-view {
    padding: 1rem 0;
  }

  .view-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: 1rem;
  }

  .view-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .title-icon {
    font-size: 1.1rem;
  }

  .refresh-button {
    padding: 0.4rem 0.75rem;
    font-size: 0.85rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-bg);
    color: var(--color-text);
    cursor: pointer;
    transition: all 0.15s;
  }

  .refresh-button:hover {
    background: var(--color-hover);
    border-color: var(--color-border-hover);
  }

  .refresh-button:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  /* Delete error banner */
  .delete-error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
    background: var(--color-error-bg);
    border: 1px solid var(--color-error);
    border-radius: 8px;
  }

  .delete-error-icon {
    font-size: 1rem;
    flex-shrink: 0;
  }

  .delete-error-message {
    flex: 1;
    font-size: 0.9rem;
    color: var(--color-error);
  }

  .delete-error-dismiss {
    padding: 0.25rem 0.5rem;
    font-size: 0.85rem;
    font-family: inherit;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--color-error);
    cursor: pointer;
    transition: background 0.15s;
    flex-shrink: 0;
  }

  .delete-error-dismiss:hover {
    background: rgba(0, 0, 0, 0.1);
  }

  .delete-error-dismiss:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  /* File list */
  .file-list {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    overflow: hidden;
  }

  .list-header {
    padding: 0.75rem 1rem;
    background: var(--color-header-bg);
    border-bottom: 1px solid var(--color-border);
  }

  .header-count {
    font-size: 0.85rem;
    color: var(--color-muted);
    font-weight: 500;
  }

  .files {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .file-item {
    border-bottom: 1px solid var(--color-border-light);
  }

  .file-item:last-child {
    border-bottom: none;
  }

  .file-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .file-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
    min-width: 0;
    padding: 0.75rem 0.75rem 0.75rem 1rem;
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    transition: background 0.15s;
    font-family: inherit;
    font-size: inherit;
    color: var(--color-text);
  }

  .file-link:hover {
    background: var(--color-hover);
  }

  .file-link:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: -2px;
  }

  .file-actions {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    margin-right: 0.75rem;
    flex-shrink: 0;
  }

  .copy-link-btn,
  .unlink-btn {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.4rem 0.65rem;
    font-size: 0.8rem;
    font-family: inherit;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-bg);
    color: var(--color-muted);
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .copy-link-btn:hover,
  .unlink-btn:hover {
    background: var(--color-hover);
    border-color: var(--color-border-hover);
    color: var(--color-text);
  }

  .copy-link-btn:focus-visible,
  .unlink-btn:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .copy-link-btn.copied {
    background: var(--color-active);
    border-color: var(--color-active-border);
    color: var(--color-link);
  }

  .unlink-btn:hover {
    border-color: var(--color-error);
    color: var(--color-error);
  }

  .unlink-btn.deleting {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .unlink-btn:disabled {
    pointer-events: none;
  }

  .btn-icon {
    font-size: 0.9rem;
  }

  .btn-text {
    font-weight: 500;
  }

  .spinner-small {
    width: 12px;
    height: 12px;
    border: 2px solid var(--color-border);
    border-top-color: var(--color-muted);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .file-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .file-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .file-name {
    font-weight: 500;
    color: var(--color-link);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-path {
    font-size: 0.8rem;
    color: var(--color-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .navigate-icon {
    color: var(--color-muted);
    font-size: 1rem;
    flex-shrink: 0;
    opacity: 0;
    transition: opacity 0.15s;
  }

  .file-link:hover .navigate-icon,
  .file-link:focus-visible .navigate-icon {
    opacity: 1;
  }

  /* Responsive */
  @media (max-width: 480px) {
    .view-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .view-title {
      font-size: 1.1rem;
    }

    .refresh-button {
      width: 100%;
      justify-content: center;
    }

    .file-row {
      flex-direction: column;
      align-items: stretch;
      gap: 0;
    }

    .file-link {
      padding: 0.875rem 0.75rem;
    }

    .file-actions {
      margin: 0 0.75rem 0.75rem 0.75rem;
      gap: 0.5rem;
    }

    .copy-link-btn,
    .unlink-btn {
      flex: 1;
      justify-content: center;
      padding: 0.5rem 0.75rem;
    }

    .file-info {
      gap: 0.25rem;
    }

    .file-path {
      font-size: 0.75rem;
    }
  }
</style>
