<script lang="ts">
  import { onMount } from 'svelte';
  import { initRouter, onRouteChange, navigateTo, getCurrentPath, isSharedRoute, navigateToShared } from './lib/router';
  import { fetchDirectory } from './lib/api';
  import { processEntries, toggleSort, DEFAULT_SORT, DEFAULT_FILTER } from './lib/sortFilter';
  import type { NginxEntry, SortState, SortField, FilterState, FetchError } from './lib/types';
  
  import Breadcrumbs from './components/Breadcrumbs.svelte';
  import Toolbar from './components/Toolbar.svelte';
  import { FileTable } from './components/FileTable';
  import UploadPanel from './components/UploadPanel.svelte';
  import SharedFilesView from './components/SharedFilesView.svelte';
  import { LoadingState, ErrorState } from './components/shared';

  // State
  let currentPath = $state('/');
  let entries = $state<NginxEntry[]>([]);
  let loading = $state(true);
  let error = $state<FetchError | null>(null);
  
  // View state: 'files' or 'shared'
  let currentView = $state<'files' | 'shared'>('files');
  
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
    
    // Check initial route type
    if (isSharedRoute()) {
      currentView = 'shared';
      loading = false;
    } else {
      currentView = 'files';
      loadDirectory(initialPath);
    }

    // Subscribe to route changes
    const cleanup = onRouteChange((newPath) => {
      if (isSharedRoute()) {
        currentView = 'shared';
        loading = false;
      } else if (newPath !== currentPath || currentView !== 'files') {
        currentView = 'files';
        loadDirectory(newPath);
      }
    });

    return cleanup;
  });
</script>

<div class="app">
  <header class="header">
    <div class="header-top">
      <h1 class="title">📂 Files Browser</h1>
      <nav class="nav-links">
        <button 
          type="button" 
          class="nav-link"
          class:active={currentView === 'files'}
          onclick={() => navigateTo('/')}
        >
          <span class="nav-icon" aria-hidden="true">📁</span>
          <span class="nav-text">Browse</span>
        </button>
        <button 
          type="button" 
          class="nav-link"
          class:active={currentView === 'shared'}
          onclick={navigateToShared}
        >
          <span class="nav-icon" aria-hidden="true">🔗</span>
          <span class="nav-text">Public Shares</span>
        </button>
      </nav>
    </div>
    {#if currentView === 'files'}
      <Breadcrumbs path={currentPath} onNavigate={handleNavigate} />
    {/if}
  </header>

  <main class="main">
    {#if currentView === 'shared'}
      <SharedFilesView />
    {:else}
      <Toolbar 
      search={filter.search}
      {sort}
      {showUpload}
      {currentPath}
      onSearchChange={handleSearchChange}
      onSortChange={handleSortChange}
      onUploadToggle={toggleUpload}
      onDirectoryCreated={() => loadDirectory(currentPath)}
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
      <LoadingState message="Loading directory..." />
    {:else if error}
      <ErrorState
        icon="⚠️"
        message={error.message}
        detail={error.status ? `HTTP ${error.status}` : ''}
        onRetry={() => loadDirectory(currentPath)}
      />
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

  .header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.5rem;
  }

  .title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .nav-links {
    display: flex;
    gap: 0.25rem;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.75rem;
    font-size: 0.85rem;
    font-family: inherit;
    border: 1px solid transparent;
    border-radius: 6px;
    background: transparent;
    color: var(--color-muted);
    cursor: pointer;
    transition: all 0.15s;
  }

  .nav-link:hover {
    background: var(--color-hover);
    color: var(--color-text);
  }

  .nav-link.active {
    background: var(--color-active);
    border-color: var(--color-active-border);
    color: var(--color-link);
  }

  .nav-link:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .nav-icon {
    font-size: 1rem;
  }

  .main {
    flex: 1;
    padding: 0 1.5rem 1.5rem;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    box-sizing: border-box;
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

    .header-top {
      flex-wrap: wrap;
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

    .header-top {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .title {
      font-size: 1.2rem;
    }

    .nav-links {
      width: 100%;
    }

    .nav-link {
      flex: 1;
      justify-content: center;
      padding: 0.5rem;
    }

    .nav-text {
      font-size: 0.8rem;
    }

    .main {
      padding: 0 0.75rem 0.75rem;
    }

    .footer {
      padding: 0.75rem 0;
    }

    .count {
      font-size: 0.8rem;
    }
  }
</style>
