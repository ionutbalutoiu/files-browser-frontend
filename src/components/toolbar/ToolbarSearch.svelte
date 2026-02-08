<script lang="ts">
  interface Props {
    search: string
    onSearchChange: (search: string) => void
  }

  let { search, onSearchChange }: Props = $props()

  function handleSearchInput(event: Event) {
    const target = event.target as HTMLInputElement
    onSearchChange(target.value)
  }

  function handleClearSearch() {
    onSearchChange("")
  }
</script>

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

<style>
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

  @media (max-width: 768px) {
    .search-container {
      flex: 1 1 100%;
      max-width: none;
      order: 1;
    }
  }

  @media (max-width: 480px) {
    .search-input {
      padding: 0.6rem 2rem 0.6rem 0.75rem;
    }
  }
</style>
