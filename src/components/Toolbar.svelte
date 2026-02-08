<script lang="ts">
  import type { SortField, SortState } from "../lib/types"
  import NewFolderInput from "./NewFolderInput.svelte"

  interface Props {
    search: string
    sort: SortState
    uploadInProgress: boolean
    currentPath: string
    selectedCount: number
    onSearchChange: (search: string) => void
    onSortChange: (field: SortField) => void
    onUploadClick: () => void
    onDirectoryCreated: () => void
    onCancelSelection: () => void
  }

  let {
    search,
    sort,
    uploadInProgress,
    currentPath,
    selectedCount,
    onSearchChange,
    onSortChange,
    onUploadClick,
    onDirectoryCreated,
    onCancelSelection,
  }: Props = $props()

  // New folder visibility state
  let showNewFolder = $state(false)

  function handleFolderCreated() {
    showNewFolder = false
    onDirectoryCreated()
  }

  function handleSearchInput(event: Event) {
    const target = event.target as HTMLInputElement
    onSearchChange(target.value)
  }

  function handleClearSearch() {
    onSearchChange("")
  }

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

  <div class="action-buttons">
    {#if selectedCount > 0}
      <span class="selection-count">
        {selectedCount} item{selectedCount !== 1 ? "s" : ""} selected
      </span>
      <button type="button" class="cancel-btn" onclick={onCancelSelection}>
        Cancel
      </button>
    {:else if showNewFolder}
      <NewFolderInput
        {currentPath}
        onCreated={handleFolderCreated}
        onCancel={() => (showNewFolder = false)}
      />
    {:else}
      <button
        type="button"
        class="new-folder-button"
        onclick={() => (showNewFolder = true)}
      >
        <span class="folder-icon" aria-hidden="true">📁</span>
        <span class="folder-text">New Folder</span>
      </button>
      <button
        type="button"
        class="upload-button"
        onclick={onUploadClick}
        disabled={uploadInProgress}
        aria-busy={uploadInProgress}
      >
        <span class="upload-icon" aria-hidden="true">↑</span>
        <span class="upload-text"
          >{uploadInProgress ? "Uploading..." : "Upload"}</span
        >
      </button>
    {/if}
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
    transition:
      border-color 0.15s,
      box-shadow 0.15s;
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

  .action-buttons {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-left: auto;
    flex-wrap: wrap;
  }

  .new-folder-button {
    display: flex;
    align-items: center;
    gap: 0.4rem;
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

  .new-folder-button:hover {
    background: var(--color-hover);
    border-color: var(--color-border-hover);
  }

  .new-folder-button:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .folder-icon {
    font-size: 0.9rem;
    line-height: 1;
  }

  .upload-button {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.75rem;
    font-size: 0.85rem;
    border: 1px solid var(--color-link);
    border-radius: 6px;
    background: var(--color-link);
    color: white;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .upload-button:hover:not(:disabled) {
    opacity: 0.9;
  }

  .upload-button:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .upload-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .upload-icon {
    font-size: 0.9rem;
    line-height: 1;
  }

  .selection-count {
    font-weight: 500;
    color: var(--color-text);
    font-size: 0.85rem;
    white-space: nowrap;
  }

  .cancel-btn {
    padding: 0.4rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-bg);
    color: var(--color-text);
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .cancel-btn:hover {
    background: var(--color-hover);
    border-color: var(--color-border-hover);
  }

  .cancel-btn:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
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
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .search-container {
      flex: 1 1 100%;
      max-width: none;
      order: 1;
    }

    .sort-controls {
      order: 2;
    }

    .action-buttons {
      order: 3;
      margin-left: 0;
    }
  }

  /* Mobile breakpoint */
  @media (max-width: 480px) {
    .toolbar {
      padding: 0.5rem 0;
      gap: 0.5rem;
    }

    .search-input {
      padding: 0.6rem 2rem 0.6rem 0.75rem;
    }

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

    .upload-button {
      padding: 0.45rem 0.6rem;
      font-size: 0.8rem;
      min-height: 36px;
    }

    .new-folder-button {
      padding: 0.45rem 0.6rem;
      font-size: 0.8rem;
      min-height: 36px;
    }

    .folder-text {
      display: none;
    }

    .upload-text {
      display: none;
    }

    .upload-icon {
      font-size: 1rem;
    }
  }
</style>
