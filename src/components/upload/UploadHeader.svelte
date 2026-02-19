<script lang="ts">
  import type { UploadSessionPhase } from "../../lib/stores/uploadSession.svelte"

  interface Props {
    phase: UploadSessionPhase
    totalFiles: number
    totalSize: string
    targetPath: string
    canRetryFailed: boolean
    onCancel: () => void
    onRetryFailed: () => void
    onDismiss: () => void
  }

  let {
    phase,
    totalFiles,
    totalSize,
    targetPath,
    canRetryFailed,
    onCancel,
    onRetryFailed,
    onDismiss,
  }: Props = $props()

  function getHeading(state: UploadSessionPhase): string {
    switch (state) {
      case "uploading":
        return "Uploading files"
      case "success":
        return "Upload complete"
      case "partial":
        return "Upload completed with warnings"
      case "cancelled":
        return "Upload cancelled"
      case "validation":
        return "Upload blocked"
      case "error":
        return "Upload failed"
      default:
        return "Upload status"
    }
  }
</script>

<div class="status-header">
  <h2 class="status-title">{getHeading(phase)}</h2>

  <div class="header-actions">
    {#if phase === "uploading"}
      <button
        type="button"
        class="status-btn danger"
        onclick={onCancel}
        aria-label="Cancel all uploads"
      >
        Cancel all
      </button>
    {:else}
      {#if canRetryFailed}
        <button
          type="button"
          class="status-btn"
          onclick={onRetryFailed}
          aria-label="Retry uploads"
        >
          Retry
        </button>
      {/if}
      <button
        type="button"
        class="status-btn"
        onclick={onDismiss}
        aria-label="Dismiss upload status"
      >
        Dismiss
      </button>
    {/if}
  </div>
</div>

<p class="status-meta">
  {totalFiles} file{totalFiles === 1 ? "" : "s"} ({totalSize}) to
  <code>{targetPath || "/"}</code>
</p>

<style>
  .status-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
  }

  .status-title {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.3;
    white-space: nowrap;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .status-btn {
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-bg);
    color: var(--color-text);
    font-size: 0.8rem;
    line-height: 1;
    padding: 0.45rem 0.65rem;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .status-btn:hover {
    border-color: var(--color-border-hover);
    background: var(--color-hover);
  }

  .status-btn:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .status-btn.danger {
    border-color: var(--color-error);
    color: var(--color-error);
  }

  .status-btn.danger:hover {
    background: var(--color-error-bg);
  }

  .status-meta {
    margin: 0.35rem 0 0;
    color: var(--color-muted);
    font-size: 0.82rem;
  }

  .status-meta code {
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
      "Courier New", monospace;
    color: var(--color-text);
    background: var(--color-hover);
    border: 1px solid var(--color-border-light);
    border-radius: 4px;
    padding: 0.05rem 0.3rem;
  }

  @media (max-width: 480px) {
    .status-header {
      flex-direction: column;
      gap: 0.65rem;
    }

    .header-actions {
      width: 100%;
      justify-content: stretch;
    }

    .status-btn {
      flex: 1;
      min-height: 38px;
    }
  }
</style>
