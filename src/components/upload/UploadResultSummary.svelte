<script lang="ts">
  import type { UploadSessionPhase } from "../../lib/stores/uploadSession.svelte"

  interface Props {
    phase: UploadSessionPhase
    uploaded: ReadonlyArray<string>
    skipped: ReadonlyArray<string>
    errors: ReadonlyArray<string>
    validationErrors: ReadonlyArray<string>
  }

  const PREVIEW_LIMIT = 6

  let { phase, uploaded, skipped, errors, validationErrors }: Props = $props()

  function preview(items: ReadonlyArray<string>): ReadonlyArray<string> {
    return items.slice(0, PREVIEW_LIMIT)
  }

  function remaining(items: ReadonlyArray<string>): number {
    return Math.max(0, items.length - PREVIEW_LIMIT)
  }
</script>

{#if phase === "validation"}
  <ul class="list validation-list" aria-label="Upload validation errors">
    {#each validationErrors as message}
      <li>{message}</li>
    {/each}
  </ul>
{:else}
  <div class="metrics">
    <span class="chip chip-success">{uploaded.length} uploaded</span>
    {#if skipped.length > 0}
      <span class="chip chip-warning">{skipped.length} already exists</span>
    {/if}
    {#if errors.length > 0}
      <span class="chip chip-error">{errors.length} errors</span>
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

<style>
  .metrics {
    margin-top: 0.4rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .list-label {
    margin: 0.4rem 0 0.2rem;
    font-size: 0.82rem;
    font-weight: 600;
  }

  .list {
    margin: 0;
    padding-left: 1rem;
    display: grid;
    gap: 0.15rem;
    font-size: 0.82rem;
    max-height: 5rem;
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
</style>
