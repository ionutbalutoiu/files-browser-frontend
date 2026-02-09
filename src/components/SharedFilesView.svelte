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
  import { getDirectoryPath } from "../lib/path"
  import { LoadingState, ErrorState, EmptyState, ConfirmDialog } from "./shared"
  import SharedFilesDeleteError from "./SharedFilesDeleteError.svelte"
  import SharedFilesList from "./SharedFilesList.svelte"

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
  async function copyLink(filePath: string) {
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
    } catch {
      deleteError = "Failed to copy share link"
    }
  }

  // Request unlink confirmation
  function requestUnlink(filePath: string) {
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
      <SharedFilesDeleteError
        message={deleteError}
        onDismiss={() => (deleteError = null)}
      />
    {/if}
    <SharedFilesList
      files={sharedFiles}
      {copiedPath}
      {deletingPath}
      onNavigateToFile={navigateToFile}
      onCopyLink={copyLink}
      onRequestUnlink={requestUnlink}
    />
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
  }
</style>
