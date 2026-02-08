<script lang="ts">
  import type { UploadSessionState } from "../../lib/stores/uploadSession.svelte"
  import UploadHeader from "./UploadHeader.svelte"
  import UploadAggregateProgress from "./UploadAggregateProgress.svelte"
  import UploadFileProgressList from "./UploadFileProgressList.svelte"
  import UploadResultSummary from "./UploadResultSummary.svelte"

  interface Props {
    sessionState: UploadSessionState
    onCancel: () => void
    onRetryFailed: () => void
    onDismiss: () => void
  }

  let { sessionState, onCancel, onRetryFailed, onDismiss }: Props = $props()

  let tone = $derived(
    sessionState.phase === "uploading"
      ? "info"
      : sessionState.phase === "success"
        ? "success"
        : sessionState.phase === "partial"
          ? "warning"
          : sessionState.phase === "cancelled"
            ? "warning"
            : "error",
  )

  let role = $derived(
    sessionState.phase === "error" || sessionState.phase === "validation"
      ? "alert"
      : "status",
  )
</script>

<section
  class={`upload-status tone-${tone}`}
  {role}
  aria-live={sessionState.phase === "uploading" ? "polite" : "assertive"}
>
  <UploadHeader
    phase={sessionState.phase}
    totalFiles={sessionState.totalFiles}
    totalSize={sessionState.totalSize}
    targetPath={sessionState.targetPath}
    canRetryFailed={sessionState.canRetryFailed}
    {onCancel}
    {onRetryFailed}
    {onDismiss}
  />

  {#if sessionState.phase === "uploading"}
    <UploadAggregateProgress
      progress={sessionState.progress}
      completedCount={sessionState.completedCount}
      failedCount={sessionState.failedCount}
      cancelledCount={sessionState.cancelledCount}
      remainingCount={sessionState.remainingCount}
      totalCount={sessionState.totalCount}
    />
    <UploadFileProgressList files={sessionState.files} />
  {:else}
    {#if sessionState.files.length > 0 && sessionState.phase !== "validation"}
      <UploadFileProgressList files={sessionState.files} />
    {/if}
    <UploadResultSummary
      phase={sessionState.phase}
      uploaded={sessionState.uploaded}
      skipped={sessionState.skipped}
      errors={sessionState.errors}
      validationErrors={sessionState.validationErrors}
    />
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

  @media (max-width: 480px) {
    .upload-status {
      padding: 0.8rem;
      margin-top: 0.7rem;
    }
  }
</style>
