<script lang="ts">
  import { onMount } from 'svelte';
  import { initRouter, onRouteChange, navigateTo, getCurrentPath } from './lib/router';
  import { fetchDirectory, type FetchError } from './lib/api';
  import { processEntries, toggleSort, DEFAULT_SORT, DEFAULT_FILTER, type SortState, type SortField, type FilterState } from './lib/sortFilter';
  import type { NginxEntry } from './lib/nginxAutoindex';
  
  import Breadcrumbs from './components/Breadcrumbs.svelte';
  import Toolbar from './components/Toolbar.svelte';
  import FileTable from './components/FileTable.svelte';
  import UploadPanel from './components/UploadPanel.svelte';

  // State
  let currentPath = $state('/');
  let entries = $state<NginxEntry[]>([]);
  let loading = $state(true);
  let error = $state<FetchError | null>(null);
  
  // Sort and filter state (preserved across navigation)
  let sort = $state<SortState>({ ...DEFAULT_SORT });
  let filter = $state<FilterState>({ ...DEFAULT_FILTER });
  
  // Upload panel visibility
  let showUpload = $state(false);

  // Derived: processed entries with filter and sort applied
  let processedEntries = $derived(processEntries(entries, filter, sort));

  // Fetch directory contents
  async function loadDirectory(path: string) {
    loading = true;
    error = null;
    entries = [];

    try {
      const result = await fetchDirectory(path);
      entries = result.entries;
      currentPath = result.path;
    } catch (e) {
      error = e as FetchError;
    } finally {
      loading = false;
    }
  }

  // Navigation handler
  function handleNavigate(path: string) {
    navigateTo(path);
  }

  // Sort change handler
  function handleSortChange(field: SortField) {
    sort = toggleSort(sort, field);
  }

  // Search change handler
  function handleSearchChange(search: string) {
    filter = { search };
  }

  // Toggle upload panel
  function toggleUpload() {
    showUpload = !showUpload;
  }

  // Refresh after upload
  function handleUploadComplete() {
    loadDirectory(currentPath);
  }

  // Initialize on mount
  onMount(() => {
    const initialPath = initRouter();
    loadDirectory(initialPath);

    // Subscribe to route changes
    const cleanup = onRouteChange((newPath) => {
      if (newPath !== currentPath) {
        loadDirectory(newPath);
      }
    });

    return cleanup;
  });
</script>

<div class="app">
  <header class="header">
    <h1 class="title">📂 Files Browser</h1>
    <Breadcrumbs path={currentPath} onNavigate={handleNavigate} />
  </header>

  <main class="main">
    <Toolbar 
      search={filter.search}
      {sort}
      {showUpload}
      onSearchChange={handleSearchChange}
      onSortChange={handleSortChange}
      onUploadToggle={toggleUpload}
    />

    {#if showUpload}
      <div id="upload-panel">
        <UploadPanel 
          {currentPath} 
          onUploadComplete={handleUploadComplete} 
        />
      </div>
    {/if}

    {#if loading}
      <div class="status loading">
        <div class="spinner" aria-hidden="true"></div>
        <p>Loading directory...</p>
      </div>
    {:else if error}
      <div class="status error" role="alert">
        <span class="error-icon" aria-hidden="true">⚠️</span>
        <p class="error-message">{error.message}</p>
        {#if error.status}
          <p class="error-detail">HTTP {error.status}</p>
        {/if}
        <button 
          type="button" 
          class="retry-button"
          onclick={() => loadDirectory(currentPath)}
        >
          Retry
        </button>
      </div>
    {:else}
      <FileTable 
        entries={processedEntries}
        {currentPath}
        {sort}
        onNavigate={handleNavigate}
        onSortChange={handleSortChange}
        onDelete={() => loadDirectory(currentPath)}
      />
      
      <footer class="footer">
        <p class="count">
          {processedEntries.length} item{processedEntries.length !== 1 ? 's' : ''}
          {#if filter.search && processedEntries.length !== entries.length}
            <span class="filtered">(filtered from {entries.length})</span>
          {/if}
        </p>
      </footer>
    {/if}
  </main>
</div>

<style>
  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-header-bg);
  }

  .title {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .main {
    flex: 1;
    padding: 0 1.5rem 1.5rem;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    box-sizing: border-box;
  }

  .status {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    text-align: center;
  }

  .loading {
    color: var(--color-muted);
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--color-border);
    border-top-color: var(--color-link);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error {
    background: var(--color-error-bg);
    border-radius: 8px;
    margin-top: 1rem;
  }

  .error-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  .error-message {
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--color-error);
    margin: 0 0 0.25rem 0;
  }

  .error-detail {
    color: var(--color-muted);
    margin: 0 0 1rem 0;
    font-size: 0.9rem;
  }

  .retry-button {
    padding: 0.5rem 1.25rem;
    font-size: 0.9rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-bg);
    color: var(--color-text);
    cursor: pointer;
    transition: all 0.15s;
  }

  .retry-button:hover {
    background: var(--color-hover);
  }

  .retry-button:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .footer {
    padding: 1rem 0;
    border-top: 1px solid var(--color-border-light);
    margin-top: 0.5rem;
  }

  .count {
    margin: 0;
    font-size: 0.85rem;
    color: var(--color-muted);
  }

  .filtered {
    font-style: italic;
  }

  /* Tablet breakpoint */
  @media (max-width: 768px) {
    .header {
      padding: 0.75rem 1rem;
    }

    .main {
      padding: 0 1rem 1rem;
    }
  }

  /* Mobile breakpoint */
  @media (max-width: 480px) {
    .header {
      padding: 0.6rem 0.75rem;
    }

    .title {
      font-size: 1.2rem;
      margin-bottom: 0.25rem;
    }

    .main {
      padding: 0 0.75rem 0.75rem;
    }

    .status {
      padding: 2rem 0.5rem;
    }

    .error-message {
      font-size: 1rem;
    }

    .retry-button {
      padding: 0.6rem 1.5rem;
      min-height: 44px;
    }

    .footer {
      padding: 0.75rem 0;
    }

    .count {
      font-size: 0.8rem;
    }
  }
</style>
