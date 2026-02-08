<script lang="ts">
  interface Props {
    progress: number
    completedCount: number
    failedCount: number
    cancelledCount: number
    remainingCount: number
    totalCount: number
  }

  let {
    progress,
    completedCount,
    failedCount,
    cancelledCount,
    remainingCount,
    totalCount,
  }: Props = $props()
</script>

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
  <span class="chip chip-info">{completedCount}/{totalCount} done</span>
  <span class="chip chip-error">{failedCount} failed</span>
  {#if cancelledCount > 0}
    <span class="chip chip-warning">{cancelledCount} cancelled</span>
  {/if}
  <span class="chip chip-neutral">{remainingCount} remaining</span>
</div>

<style>
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

  .queue-metrics {
    margin-top: 0.65rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
</style>
