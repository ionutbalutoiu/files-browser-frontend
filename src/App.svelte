<script lang="ts">
  import { onMount } from "svelte"
  import {
    initRouter,
    onRouteChange,
    navigateTo,
    isSharedRoute,
    navigateToShared,
  } from "./lib/router"
  import { fetchDirectory } from "./lib/api"
  import {
    processEntries,
    toggleSort,
    DEFAULT_SORT,
    DEFAULT_FILTER,
  } from "./lib/sortFilter"
  import type {
    NginxEntry,
    SortState,
    SortField,
    FilterState,
    AppError,
  } from "./lib/types"
  import {
    getUploadSessionState,
    startUploadSession,
    cancelUploadSession,
    retryFailedUploads,
    dismissUploadSession,
  } from "./lib/stores/uploadSession.svelte"

  import AppHeader from "./components/layout/AppHeader.svelte"
  import FilesPage from "./components/layout/FilesPage.svelte"
  import SharedFilesView from "./components/SharedFilesView.svelte"
  import { ToastContainer } from "./components/shared"

  let currentPath = $state("/")
  let entries = $state<NginxEntry[]>([])
  let loading = $state(true)
  let error = $state<AppError | null>(null)

  let currentView = $state<"files" | "shared">("files")
  let sort = $state<SortState>({ ...DEFAULT_SORT })
  let filter = $state<FilterState>({ ...DEFAULT_FILTER })

  let isSelectionMode = $state(false)
  let selectedEntries = $state<Set<string>>(new Set())

  const uploadSessionState = getUploadSessionState()
  let uploadInProgress = $derived(uploadSessionState.phase === "uploading")
  let processedEntries = $derived(processEntries(entries, filter, sort))

  let lastHandledUploadCompletion = $state(0)

  async function loadDirectory(path: string) {
    loading = true
    error = null
    entries = []

    try {
      const result = await fetchDirectory(path)
      entries = result.entries
      currentPath = result.path
    } catch (fetchError) {
      error = fetchError as AppError
    } finally {
      loading = false
    }
  }

  function handleNavigate(path: string) {
    navigateTo(path)
  }

  function handleSortChange(field: SortField) {
    sort = toggleSort(sort, field)
  }

  function handleSearchChange(search: string) {
    filter = { search }
  }

  function cancelSelectionMode() {
    isSelectionMode = false
    selectedEntries = new Set()
  }

  function handleUploadFilesSelected(files: File[]) {
    if (files.length === 0) return
    void startUploadSession({
      files,
      targetPath: currentPath,
    })
  }

  $effect(() => {
    const completionToken = uploadSessionState.completionToken
    if (completionToken <= lastHandledUploadCompletion) return

    lastHandledUploadCompletion = completionToken

    if (
      currentView === "files" &&
      currentPath === uploadSessionState.lastCompletedTargetPath
    ) {
      void loadDirectory(uploadSessionState.lastCompletedTargetPath)
    }
  })

  onMount(() => {
    const initialPath = initRouter()

    if (isSharedRoute()) {
      currentView = "shared"
      loading = false
    } else {
      currentView = "files"
      void loadDirectory(initialPath)
    }

    const cleanup = onRouteChange((newPath) => {
      if (isSharedRoute()) {
        currentView = "shared"
        loading = false
      } else if (newPath !== currentPath || currentView !== "files") {
        currentView = "files"
        void loadDirectory(newPath)
      }
    })

    return cleanup
  })
</script>

<div class="app">
  <AppHeader
    {currentView}
    {currentPath}
    onNavigateHome={() => navigateTo("/")}
    onNavigateBrowse={() => navigateTo("/")}
    onNavigateShared={navigateToShared}
    onNavigatePath={handleNavigate}
  />

  <main class="main">
    {#if currentView === "shared"}
      <SharedFilesView />
    {:else}
      <FilesPage
        search={filter.search}
        {sort}
        {uploadInProgress}
        {currentPath}
        selectedCount={selectedEntries.size}
        {loading}
        {error}
        {processedEntries}
        allEntriesCount={entries.length}
        {isSelectionMode}
        {selectedEntries}
        {uploadSessionState}
        onSearchChange={handleSearchChange}
        onSortChange={handleSortChange}
        onUploadFilesSelected={handleUploadFilesSelected}
        onDirectoryCreated={() => loadDirectory(currentPath)}
        onCancelSelection={cancelSelectionMode}
        onNavigate={handleNavigate}
        onDelete={() => loadDirectory(currentPath)}
        onRefresh={() => loadDirectory(currentPath)}
        onSelectionModeChange={(mode: boolean) => (isSelectionMode = mode)}
        onSelectedEntriesChange={(entriesSet: Set<string>) =>
          (selectedEntries = entriesSet)}
        onCancelUpload={cancelUploadSession}
        onRetryFailedUpload={() => void retryFailedUploads()}
        onDismissUpload={dismissUploadSession}
      />
    {/if}
  </main>
</div>

<ToastContainer />

<style>
  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .main {
    flex: 1;
    padding: 0 1.5rem 1.5rem;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    box-sizing: border-box;
  }

  @media (max-width: 768px) {
    .main {
      padding: 0 1rem 1rem;
    }
  }

  @media (max-width: 480px) {
    .main {
      padding: 0 0.75rem 0.75rem;
    }
  }
</style>
