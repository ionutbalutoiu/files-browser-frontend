<script lang="ts">
  import { getFileName, getDirectoryPath } from "../lib/path"

  interface Props {
    files: string[]
    copiedPath: string | null
    deletingPath: string | null
    onNavigateToFile: (filePath: string) => void
    onCopyLink: (filePath: string) => void
    onRequestUnlink: (filePath: string) => void
  }

  let {
    files,
    copiedPath,
    deletingPath,
    onNavigateToFile,
    onCopyLink,
    onRequestUnlink,
  }: Props = $props()
</script>

<div class="file-list">
  <div class="list-header">
    <span class="header-count"
      >{files.length} shared file{files.length !== 1 ? "s" : ""}</span
    >
  </div>
  <ul class="files" role="list">
    {#each files as filePath}
      <li class="file-item">
        <div class="file-row">
          <button
            type="button"
            class="file-link"
            onclick={() => onNavigateToFile(filePath)}
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
              onclick={() => onCopyLink(filePath)}
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
              onclick={() => onRequestUnlink(filePath)}
              disabled={deletingPath === filePath}
              title="Remove public share"
            >
              {#if deletingPath === filePath}
                <span class="btn-icon spinner-small" aria-hidden="true"></span>
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

<style>
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

  .file-link:hover .file-name {
    text-decoration: underline;
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

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 480px) {
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
