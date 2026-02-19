<script lang="ts">
  import type { ParallelUploadFileProgress } from "../../lib/api"

  interface Props {
    files: ReadonlyArray<ParallelUploadFileProgress>
  }

  let { files }: Props = $props()

  function getFileStatusLabel(
    status: ParallelUploadFileProgress["status"],
  ): string {
    const labels: Record<ParallelUploadFileProgress["status"], string> = {
      queued: "Queued",
      uploading: "Uploading",
      retrying: "Retrying",
      uploaded: "Uploaded",
      skipped: "Already exists",
      error: "Failed",
      cancelled: "Cancelled",
    }
    return labels[status]
  }
</script>

{#if files.length > 0}
  <ul class="file-progress-list" aria-label="Per file upload progress">
    {#each files as item}
      <li class="file-progress-item">
        <div class="file-progress-header">
          <span class="file-progress-name" title={item.name}>{item.name}</span>
          <span class={`file-status file-status-${item.status}`}
            >{getFileStatusLabel(item.status)}</span
          >
        </div>
        <div class="file-progress-track" role="presentation">
          <div
            class={`file-progress-fill file-progress-${item.status}`}
            style={`width: ${item.percent}%`}
          ></div>
        </div>
        {#if item.status === "retrying"}
          <p class="file-progress-message">Attempt {item.attempt}</p>
        {/if}
        {#if item.message && (item.status === "error" || item.status === "cancelled")}
          <p class="file-progress-message">{item.message}</p>
        {/if}
      </li>
    {/each}
  </ul>
{/if}

<style>
  .file-progress-list {
    margin: 0.4rem 0 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 0.35rem;
    max-height: 8rem;
    overflow: auto;
  }

  .file-progress-item {
    border: 1px solid var(--color-border-light);
    border-radius: 6px;
    padding: 0.3rem 0.5rem;
    background: var(--color-bg);
  }

  .file-progress-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    margin-bottom: 0.2rem;
  }

  .file-progress-name {
    font-size: 0.82rem;
    color: var(--color-text);
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }

  .file-status {
    font-size: 0.72rem;
    padding: 0.12rem 0.35rem;
    border-radius: 999px;
    border: 1px solid transparent;
    white-space: nowrap;
  }

  .file-status-queued {
    color: var(--color-muted);
    border-color: var(--color-border);
    background: var(--color-hover);
  }

  .file-status-uploading,
  .file-status-retrying {
    color: var(--color-info-text);
    border-color: var(--color-info);
    background: var(--color-info-bg);
  }

  .file-status-uploaded {
    color: var(--color-success-text);
    border-color: var(--color-success);
    background: var(--color-success-bg);
  }

  .file-status-skipped {
    color: var(--color-warning-text);
    border-color: var(--color-warning);
    background: var(--color-warning-bg);
  }

  .file-status-error,
  .file-status-cancelled {
    color: var(--color-error);
    border-color: var(--color-error);
    background: var(--color-error-bg);
  }

  .file-progress-track {
    width: 100%;
    height: 6px;
    border-radius: 999px;
    overflow: hidden;
    background: var(--color-border-light);
  }

  .file-progress-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.2s ease;
  }

  .file-progress-queued {
    background: var(--color-border);
  }

  .file-progress-uploading,
  .file-progress-retrying {
    background: linear-gradient(
      90deg,
      var(--color-info) 0%,
      var(--color-link) 100%
    );
  }

  .file-progress-uploaded {
    background: var(--color-success);
  }

  .file-progress-skipped {
    background: var(--color-warning);
  }

  .file-progress-error,
  .file-progress-cancelled {
    background: var(--color-error);
  }

  .file-progress-message {
    margin: 0.3rem 0 0;
    font-size: 0.75rem;
    color: var(--color-error);
    word-break: break-word;
  }
</style>
