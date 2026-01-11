<script lang="ts">
  import type { SortField, SortState } from '../lib/sortFilter';

  interface Props {
    search: string;
    sort: SortState;
    onSearchChange: (search: string) => void;
    onSortChange: (field: SortField) => void;
  }

  let { search, sort, onSearchChange, onSortChange }: Props = $props();

  function handleSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    onSearchChange(target.value);
  }

  function handleClearSearch() {
    onSearchChange('');
  }

  function getSortLabel(field: SortField): string {
    const labels: Record<SortField, string> = {
      name: 'Name',
      size: 'Size',
      mtime: 'Modified',
    };
    return labels[field];
  }

  function getSortIndicator(field: SortField): string {
    if (sort.field !== field) return '';
    return sort.direction === 'asc' ? ' ↑' : ' ↓';
  }

  function isActive(field: SortField): boolean {
    return sort.field === field;
  }
</script>

<div class="toolbar">
  <div class="search-container">
    <label for="search-input" class="visually-hidden">Search files</label>
    <input
      id="search-input"
      type="search"
      placeholder="Search files..."
      value={search}
      oninput={handleSearchInput}
      class="search-input"
    />
    {#if search}
      <button 
        type="button" 
        class="clear-button"
        onclick={handleClearSearch}
        aria-label="Clear search"
      >
        ×
      </button>
    {/if}
  </div>

  <div class="sort-controls">
    <span class="sort-label">Sort by:</span>
    {#each ['name', 'size', 'mtime'] as field}
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
</div>

<style>
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--color-border);
  }

  .search-container {
    position: relative;
    flex: 1;
    min-width: 200px;
    max-width: 400px;
  }

  .search-input {
    width: 100%;
    padding: 0.5rem 2rem 0.5rem 0.75rem;
    font-size: 0.9rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-input-bg);
    color: var(--color-text);
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .search-input::placeholder {
    color: var(--color-muted);
  }

  .search-input:focus {
    outline: none;
    border-color: var(--color-focus);
    box-shadow: 0 0 0 3px var(--color-focus-ring);
  }

  .clear-button {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    font-size: 1.25rem;
    color: var(--color-muted);
    cursor: pointer;
    padding: 0.25rem;
    line-height: 1;
    border-radius: 4px;
  }

  .clear-button:hover {
    color: var(--color-text);
    background: var(--color-hover);
  }

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

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }

  /* Tablet breakpoint */
  @media (max-width: 768px) {
    .toolbar {
      flex-direction: column;
      align-items: stretch;
      gap: 0.75rem;
    }

    .search-container {
      max-width: none;
    }

    .sort-controls {
      justify-content: flex-start;
    }
  }

  /* Mobile breakpoint */
  @media (max-width: 480px) {
    .toolbar {
      padding: 0.5rem 0;
    }

    .search-input {
      padding: 0.6rem 2rem 0.6rem 0.75rem;
    }

    .sort-controls {
      gap: 0.4rem;
    }

    .sort-label {
      font-size: 0.8rem;
      flex-basis: 100%;
      margin-bottom: -0.25rem;
    }

    .sort-button {
      padding: 0.5rem 0.6rem;
      font-size: 0.8rem;
      flex: 1;
      text-align: center;
      min-height: 36px;
    }
  }
</style>
