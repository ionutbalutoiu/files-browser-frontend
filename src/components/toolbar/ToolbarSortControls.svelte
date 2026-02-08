<script lang="ts">
  import type { SortField, SortState } from "../../lib/types"

  interface Props {
    sort: SortState
    onSortChange: (field: SortField) => void
  }

  let { sort, onSortChange }: Props = $props()

  function getSortLabel(field: SortField): string {
    const labels: Record<SortField, string> = {
      name: "Name",
      size: "Size",
      mtime: "Modified",
    }
    return labels[field]
  }

  function getSortIndicator(field: SortField): string {
    if (sort.field !== field) return ""
    return sort.direction === "asc" ? " ↑" : " ↓"
  }

  function isActive(field: SortField): boolean {
    return sort.field === field
  }
</script>

<div class="sort-controls">
  <span class="sort-label">Sort:</span>
  {#each ["name", "size", "mtime"] as field}
    <button
      type="button"
      class="sort-button"
      class:active={isActive(field as SortField)}
      onclick={() => onSortChange(field as SortField)}
      aria-pressed={isActive(field as SortField)}
    >
      {getSortLabel(field as SortField)}{getSortIndicator(field as SortField)}
    </button>
  {/each}
</div>

<style>
  .sort-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .sort-label {
    color: var(--color-muted);
    font-size: 0.85rem;
  }

  .sort-button {
    padding: 0.4rem 0.75rem;
    font-size: 0.85rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-bg);
    color: var(--color-text);
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .sort-button:hover {
    background: var(--color-hover);
    border-color: var(--color-border-hover);
  }

  .sort-button:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .sort-button.active {
    background: var(--color-active);
    border-color: var(--color-active-border);
    font-weight: 500;
  }

  @media (max-width: 768px) {
    .sort-controls {
      order: 2;
    }
  }

  @media (max-width: 480px) {
    .sort-controls {
      flex: 1;
      gap: 0.35rem;
    }

    .sort-label {
      display: none;
    }

    .sort-button {
      padding: 0.45rem 0.5rem;
      font-size: 0.8rem;
      min-height: 36px;
    }
  }
</style>
