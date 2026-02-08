<script lang="ts">
  import type { ParallelUploadFileProgress } from "../lib/api"

  export type UploadState =
    | "uploading"
    | "success"
    | "partial"
    | "error"
    | "validation"

  interface Props {
    state: UploadState
    progress: number
    totalFiles: number
    totalSize: string
    targetPath: string
    uploaded: ReadonlyArray<string>
    skipped: ReadonlyArray<string>
    errors: ReadonlyArray<string>
    validationErrors: ReadonlyArray<string>
    fileProgress: ReadonlyArray<ParallelUploadFileProgress>
    completedCount: number
    failedCount: number
    remainingCount: number
    totalCount: number
    onDismiss: () => void
  }

  const PREVIEW_LIMIT = 6

  let {
    state,
    progress,
    totalFiles,
    totalSize,
    targetPath,
    uploaded,
    skipped,
    errors,
    validationErrors,
    fileProgress,
    completedCount,
    failedCount,
    remainingCount,
    totalCount,
    onDismiss,
  }: Props = $props()

  function preview(items: ReadonlyArray<string>): ReadonlyArray<string> {
    return items.slice(0, PREVIEW_LIMIT)
  }

  function remaining(items: ReadonlyArray<string>): number {
    return Math.max(0, items.length - PREVIEW_LIMIT)
  }

  function getFileStatusLabel(
    status: ParallelUploadFileProgress["status"],
  ): string {
    const labels: Record<ParallelUploadFileProgress["status"], string> = {
      queued: "Queued",
      uploading: "Uploading",
      uploaded: "Uploaded",
      skipped: "Already exists",
      error: "Failed",
    }
    return labels[status]
  }

  let tone = $derived(
    state === "uploading"
      ? "info"
      : state === "success"
        ? "success"
        : state === "partial"
          ? "warning"
          : "error",
  )

  let heading = $derived(
    state === "uploading"
      ? "Uploading files"
      : state === "success"
        ? "Upload complete"
        : state === "partial"
          ? "Upload completed with warnings"
          : state === "validation"
            ? "Upload blocked"
            : "Upload failed",
  )

  let role = $derived(
    state === "error" || state === "validation" ? "alert" : "status",
  )
</script>

<section
  class={`upload-status tone-${tone}`}
  {role}
  aria-live={state === "uploading" ? "polite" : "assertive"}
>
  <div class="status-header">
    <div>
      <p class="status-label">Upload status</p>
      <h2 class="status-title">{heading}</h2>
    </div>
    <button
      type="button"
      class="dismiss-button"
      onclick={onDismiss}
      disabled={state === "uploading"}
      aria-label="Dismiss upload status"
    >
      {state === "uploading" ? "Working..." : "Dismiss"}
    </button>
  </div>

  <p class="status-meta">
    {totalFiles} file{totalFiles === 1 ? "" : "s"} ({totalSize}) to
    <code>{targetPath || "/"}</code>
  </p>

  {#if state === "uploading"}
    <div class="progress-row">
      <div
        class="progress-track"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="Upload progress"
      >
        <div class="progress-fill" style={`width: ${progress}%`}></div>
      </div>
      <span class="progress-value">{progress}%</span>
    </div>

    <div class="queue-metrics" aria-label="Upload queue summary">
      <span class="metric metric-info">{completedCount}/{totalCount} done</span>
      <span class="metric metric-error">{failedCount} failed</span>
      <span class="metric metric-neutral">{remainingCount} remaining</span>
    </div>

    {#if fileProgress.length > 0}
      <ul class="file-progress-list" aria-label="Per file upload progress">
        {#each fileProgress as item, index (`${item.name}-${index}`)}
          <li class="file-progress-item">
            <div class="file-progress-header">
              <span class="file-progress-name" title={item.name}
                >{item.name}</span
              >
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
            {#if item.status === "error" && item.message}
              <p class="file-progress-message">{item.message}</p>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  {/if}

  {#if state === "validation"}
    <ul class="list validation-list">
      {#each validationErrors as message}
        <li>{message}</li>
      {/each}
    </ul>
  {:else if state !== "uploading"}
    <div class="metrics">
      <span class="metric metric-success">{uploaded.length} uploaded</span>
      {#if skipped.length > 0}
        <span class="metric metric-warning"
          >{skipped.length} already exists</span
        >
      {/if}
      {#if errors.length > 0}
        <span class="metric metric-error">{errors.length} errors</span>
      {/if}
    </div>

    {#if uploaded.length > 0}
      <p class="list-label">Uploaded</p>
      <ul class="list">
        {#each preview(uploaded) as fileName}
          <li>{fileName}</li>
        {/each}
      </ul>
      {#if remaining(uploaded) > 0}
        <p class="more-items">+{remaining(uploaded)} more uploaded files</p>
      {/if}
    {/if}

    {#if skipped.length > 0}
      <p class="list-label">Already exists (skipped)</p>
      <ul class="list">
        {#each preview(skipped) as fileName}
          <li>{fileName}</li>
        {/each}
      </ul>
      {#if remaining(skipped) > 0}
        <p class="more-items">+{remaining(skipped)} more skipped files</p>
      {/if}
    {/if}

    {#if errors.length > 0}
      <p class="list-label">Errors</p>
      <ul class="list error-list">
        {#each preview(errors) as message}
          <li>{message}</li>
        {/each}
      </ul>
      {#if remaining(errors) > 0}
        <p class="more-items">+{remaining(errors)} more errors</p>
      {/if}
    {/if}
  {/if}
</section>

<style>
  .upload-status {
    margin: 0.85rem 0 1rem;
    padding: 1rem;
    border: 1px solid var(--color-border);
    border-left-width: 4px;
    border-radius: 8px;
    background: var(--color-bg);
    box-shadow: var(--shadow-sm);
  }

  .upload-status.tone-info {
    border-left-color: var(--color-info);
  }

  .upload-status.tone-success {
    border-left-color: var(--color-success);
  }

  .upload-status.tone-warning {
    border-left-color: var(--color-warning);
  }

  .upload-status.tone-error {
    border-left-color: var(--color-error);
  }

  .status-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }

  .status-label {
    margin: 0;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-muted);
  }

  .status-title {
    margin: 0.2rem 0 0;
    font-size: 1rem;
    line-height: 1.3;
  }

  .dismiss-button {
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

  .dismiss-button:hover:not(:disabled) {
    border-color: var(--color-border-hover);
    background: var(--color-hover);
  }

  .dismiss-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .status-meta {
    margin: 0.65rem 0 0;
    color: var(--color-muted);
    font-size: 0.9rem;
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

  .progress-row {
    margin-top: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .progress-track {
    flex: 1;
    height: 10px;
    border-radius: 999px;
    overflow: hidden;
    background: var(--color-border-light);
  }

  .progress-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      var(--color-info) 0%,
      var(--color-link) 100%
    );
    transition: width 0.2s ease;
  }

  .progress-value {
    font-size: 0.85rem;
    color: var(--color-muted);
    min-width: 2.5rem;
    text-align: right;
  }

  .metrics {
    margin-top: 0.8rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .queue-metrics {
    margin-top: 0.65rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .file-progress-list {
    margin: 0.75rem 0 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 0.55rem;
    max-height: 12rem;
    overflow: auto;
  }

  .file-progress-item {
    border: 1px solid var(--color-border-light);
    border-radius: 6px;
    padding: 0.45rem 0.55rem;
    background: var(--color-bg);
  }

  .file-progress-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    margin-bottom: 0.35rem;
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

  .file-status-uploading {
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

  .file-status-error {
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

  .file-progress-uploading {
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

  .file-progress-error {
    background: var(--color-error);
  }

  .file-progress-message {
    margin: 0.3rem 0 0;
    font-size: 0.75rem;
    color: var(--color-error);
    word-break: break-word;
  }

  .metric {
    font-size: 0.8rem;
    border-radius: 999px;
    padding: 0.2rem 0.55rem;
    border: 1px solid transparent;
    font-weight: 500;
  }

  .metric-success {
    background: var(--color-success-bg);
    color: var(--color-success-text);
    border-color: var(--color-success);
  }

  .metric-info {
    background: var(--color-info-bg);
    color: var(--color-info-text);
    border-color: var(--color-info);
  }

  .metric-warning {
    background: var(--color-warning-bg);
    color: var(--color-warning-text);
    border-color: var(--color-warning);
  }

  .metric-error {
    background: var(--color-error-bg);
    color: var(--color-error);
    border-color: var(--color-error);
  }

  .metric-neutral {
    background: var(--color-hover);
    color: var(--color-text);
    border-color: var(--color-border);
  }

  .list-label {
    margin: 0.7rem 0 0.35rem;
    font-size: 0.82rem;
    font-weight: 600;
  }

  .list {
    margin: 0;
    padding-left: 1rem;
    display: grid;
    gap: 0.2rem;
    font-size: 0.85rem;
    max-height: 7.25rem;
    overflow: auto;
  }

  .validation-list,
  .error-list {
    color: var(--color-error);
  }

  .more-items {
    margin: 0.35rem 0 0;
    font-size: 0.8rem;
    color: var(--color-muted);
  }

  @media (max-width: 480px) {
    .upload-status {
      padding: 0.8rem;
      margin-top: 0.7rem;
    }

    .status-header {
      flex-direction: column;
      gap: 0.65rem;
    }

    .dismiss-button {
      width: 100%;
      min-height: 38px;
    }
  }
</style>
