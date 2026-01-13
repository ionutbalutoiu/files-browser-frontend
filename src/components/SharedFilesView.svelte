<script lang="ts">
  import { onMount } from 'svelte';
  import { listSharePublicFiles, type SharePublicFilesError } from '../lib/api';
  import { navigateTo } from '../lib/router';
  import { getPublicFileUrl } from '../lib/config';

  // State
  let sharedFiles = $state<string[]>([]);
  let copiedPath = $state<string | null>(null);
  let loading = $state(true);
  let error = $state<SharePublicFilesError | null>(null);

  // Fetch shared files
  async function loadSharedFiles() {
    loading = true;
    error = null;
    sharedFiles = [];

    try {
      sharedFiles = await listSharePublicFiles();
    } catch (e) {
      error = e as SharePublicFilesError;
    } finally {
      loading = false;
    }
  }

  // Navigate to file's parent directory
  function navigateToFile(filePath: string) {
    // Extract the directory path from the file path
    const lastSlash = filePath.lastIndexOf('/');
    const dirPath = lastSlash > 0 ? '/' + filePath.substring(0, lastSlash + 1) : '/';
    navigateTo(dirPath);
  }

  // Get filename from path
  function getFileName(filePath: string): string {
    const lastSlash = filePath.lastIndexOf('/');
    return lastSlash >= 0 ? filePath.substring(lastSlash + 1) : filePath;
  }

  // Get directory from path
  function getDirectory(filePath: string): string {
    const lastSlash = filePath.lastIndexOf('/');
    return lastSlash > 0 ? filePath.substring(0, lastSlash + 1) : '/';
  }

  // Copy public link to clipboard
  async function copyLink(filePath: string, event: MouseEvent) {
    event.stopPropagation();
    const url = getPublicFileUrl(filePath);
    try {
      await navigator.clipboard.writeText(url);
      copiedPath = filePath;
      // Reset after 2 seconds
      setTimeout(() => {
        if (copiedPath === filePath) {
          copiedPath = null;
        }
      }, 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  }

  onMount(() => {
    loadSharedFiles();
  });
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
    <div class="status loading">
      <div class="spinner" aria-hidden="true"></div>
      <p>Loading shared files...</p>
    </div>
  {:else if error}
    <div class="status error" role="alert">
      <span class="error-icon" aria-hidden="true">
        {#if error.notEnabled}🚫{:else}⚠️{/if}
      </span>
      <p class="error-message">{error.message}</p>
      {#if error.notEnabled}
        <p class="error-hint">
          The public sharing feature needs to be enabled in the server configuration.
        </p>
      {:else}
        <button 
          type="button" 
          class="retry-button"
          onclick={loadSharedFiles}
        >
          Retry
        </button>
      {/if}
    </div>
  {:else if sharedFiles.length === 0}
    <div class="status empty">
      <span class="empty-icon" aria-hidden="true">📭</span>
      <p class="empty-message">No files have been shared publicly</p>
      <p class="empty-hint">
        Use the share button on any file to make it publicly accessible.
      </p>
    </div>
  {:else}
    <div class="file-list">
      <div class="list-header">
        <span class="header-count">{sharedFiles.length} shared file{sharedFiles.length !== 1 ? 's' : ''}</span>
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
                  <span class="file-path">{getDirectory(filePath)}</span>
                </span>
                <span class="navigate-icon" aria-hidden="true">→</span>
              </button>
              <button
                type="button"
                class="copy-link-btn"
                class:copied={copiedPath === filePath}
                onclick={(e) => copyLink(filePath, e)}
                title="Copy public link"
              >
                {#if copiedPath === filePath}
                  <span class="copy-icon" aria-hidden="true">✓</span>
                  <span class="copy-text">Copied!</span>
                {:else}
                  <span class="copy-icon" aria-hidden="true">🔗</span>
                  <span class="copy-text">Copy Link</span>
                {/if}
              </button>
            </div>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>

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

  /* Status states */
  .status {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    text-align: center;
  }

  .loading {
    color: var(--color-muted);
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--color-border);
    border-top-color: var(--color-link);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error {
    background: var(--color-error-bg);
    border-radius: 8px;
  }

  .error-icon, .empty-icon {
    font-size: 2.5rem;
    margin-bottom: 0.75rem;
  }

  .error-message {
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--color-error);
    margin: 0 0 0.5rem 0;
  }

  .error-hint, .empty-hint {
    color: var(--color-muted);
    margin: 0;
    font-size: 0.9rem;
    max-width: 400px;
  }

  .retry-button {
    margin-top: 1rem;
    padding: 0.5rem 1.25rem;
    font-size: 0.9rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-bg);
    color: var(--color-text);
    cursor: pointer;
    transition: all 0.15s;
  }

  .retry-button:hover {
    background: var(--color-hover);
  }

  .retry-button:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  /* Empty state */
  .empty {
    background: var(--color-header-bg);
    border-radius: 8px;
  }

  .empty-message {
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--color-text);
    margin: 0 0 0.5rem 0;
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

  .copy-link-btn {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.4rem 0.65rem;
    margin-right: 0.75rem;
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

  .copy-link-btn:hover {
    background: var(--color-hover);
    border-color: var(--color-border-hover);
    color: var(--color-text);
  }

  .copy-link-btn:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .copy-link-btn.copied {
    background: var(--color-active);
    border-color: var(--color-active-border);
    color: var(--color-link);
  }

  .copy-icon {
    font-size: 0.9rem;
  }

  .copy-text {
    font-weight: 500;
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

    .status {
      padding: 2rem 0.75rem;
    }

    .file-row {
      flex-direction: column;
      align-items: stretch;
      gap: 0;
    }

    .file-link {
      padding: 0.875rem 0.75rem;
    }

    .copy-link-btn {
      margin: 0 0.75rem 0.75rem 0.75rem;
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
