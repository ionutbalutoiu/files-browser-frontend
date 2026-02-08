<script lang="ts">
  import { onMount } from "svelte"
  import {
    initRouter,
    onRouteChange,
    navigateTo,
    isSharedRoute,
    navigateToShared,
  } from "./lib/router"
  import {
    fetchDirectory,
    uploadFilesInParallelWithProgress,
    validateFiles,
    formatTotalSize,
  } from "./lib/api"
  import type { ParallelUploadFileProgress } from "./lib/api"
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

  import Breadcrumbs from "./components/Breadcrumbs.svelte"
  import Toolbar from "./components/Toolbar.svelte"
  import { FileTable } from "./components/FileTable"
  import UploadStatus from "./components/UploadStatus.svelte"
  import SharedFilesView from "./components/SharedFilesView.svelte"
  import { LoadingState, ErrorState, ToastContainer } from "./components/shared"

  // State
  let currentPath = $state("/")
  let entries = $state<NginxEntry[]>([])
  let loading = $state(true)
  let error = $state<AppError | null>(null)

  // View state: 'files' or 'shared'
  let currentView = $state<"files" | "shared">("files")

  // Sort and filter state (preserved across navigation)
  let sort = $state<SortState>({ ...DEFAULT_SORT })
  let filter = $state<FilterState>({ ...DEFAULT_FILTER })

  type UploadStatusState =
    | "uploading"
    | "success"
    | "partial"
    | "error"
    | "validation"
  type UploadUiState = "hidden" | UploadStatusState

  let uploadInput = $state<HTMLInputElement | null>(null)
  let uploadState = $state<UploadUiState>("hidden")
  let uploadProgress = $state(0)
  let uploadTargetPath = $state("/")
  let uploadTotalFiles = $state(0)
  let uploadTotalSize = $state("0 B")
  let uploadUploaded = $state<string[]>([])
  let uploadSkipped = $state<string[]>([])
  let uploadErrors = $state<string[]>([])
  let uploadValidationErrors = $state<string[]>([])
  let uploadFileProgress = $state<ParallelUploadFileProgress[]>([])
  let uploadCompletedCount = $state(0)
  let uploadFailedCount = $state(0)
  let uploadRemainingCount = $state(0)
  let uploadTotalCount = $state(0)
  let uploadInProgress = $derived(uploadState === "uploading")
  let visibleUploadState = $derived(
    uploadState === "hidden" ? null : uploadState,
  )

  const UPLOAD_CONCURRENCY = 2

  // Selection mode state
  let isSelectionMode = $state(false)
  let selectedEntries = $state<Set<string>>(new Set())

  // Cancel selection mode
  function cancelSelectionMode() {
    isSelectionMode = false
    selectedEntries = new Set()
  }

  // Derived: processed entries with filter and sort applied
  let processedEntries = $derived(processEntries(entries, filter, sort))

  // Fetch directory contents
  async function loadDirectory(path: string) {
    loading = true
    error = null
    entries = []

    try {
      const result = await fetchDirectory(path)
      entries = result.entries
      currentPath = result.path
    } catch (e) {
      error = e as AppError
    } finally {
      loading = false
    }
  }

  // Navigation handler
  function handleNavigate(path: string) {
    navigateTo(path)
  }

  // Sort change handler
  function handleSortChange(field: SortField) {
    sort = toggleSort(sort, field)
  }

  // Search change handler
  function handleSearchChange(search: string) {
    filter = { search }
  }

  function clearUploadFeedback() {
    uploadState = "hidden"
    uploadProgress = 0
    uploadTotalFiles = 0
    uploadTotalSize = "0 B"
    uploadUploaded = []
    uploadSkipped = []
    uploadErrors = []
    uploadValidationErrors = []
    uploadFileProgress = []
    uploadCompletedCount = 0
    uploadFailedCount = 0
    uploadRemainingCount = 0
    uploadTotalCount = 0
  }

  function dismissUploadStatus() {
    if (uploadState === "uploading") return
    clearUploadFeedback()
  }

  function openUploadPicker() {
    if (uploadState === "uploading") return
    uploadInput?.click()
  }

  async function handleUploadSelection(event: Event) {
    const input = event.target as HTMLInputElement
    if (!input.files || input.files.length === 0) return

    const selectedFiles = Array.from(input.files)
    input.value = ""

    const targetPath = currentPath

    uploadTargetPath = targetPath || "/"
    uploadTotalFiles = selectedFiles.length
    uploadTotalSize = formatTotalSize(selectedFiles)
    uploadProgress = 0
    uploadUploaded = []
    uploadSkipped = []
    uploadErrors = []
    uploadValidationErrors = []
    uploadFileProgress = selectedFiles.map((file) => ({
      name: file.name,
      percent: 0,
      status: "queued",
    }))
    uploadCompletedCount = 0
    uploadFailedCount = 0
    uploadRemainingCount = selectedFiles.length
    uploadTotalCount = selectedFiles.length

    // Existing-name conflicts are handled server-side so queue can continue.
    const validationMessages = validateFiles(selectedFiles)

    if (validationMessages.length > 0) {
      uploadState = "validation"
      uploadValidationErrors = validationMessages
      return
    }

    uploadState = "uploading"

    try {
      const result = await uploadFilesInParallelWithProgress(
        selectedFiles,
        targetPath,
        {
          concurrency: UPLOAD_CONCURRENCY,
          onProgress: (progress) => {
            uploadProgress = progress.percent
            uploadCompletedCount = progress.completed
            uploadFailedCount = progress.failed
            uploadRemainingCount = progress.remaining
            uploadTotalCount = progress.total
            uploadFileProgress = progress.files
          },
        },
      )

      uploadUploaded = result.uploaded
      uploadSkipped = result.skipped
      uploadErrors = result.errors ?? []

      if (uploadUploaded.length === 0 && uploadErrors.length > 0) {
        uploadState = "error"
      } else if (uploadSkipped.length > 0 || uploadErrors.length > 0) {
        uploadState = "partial"
      } else {
        uploadState = "success"
      }

      // Refresh only when still viewing the same directory.
      if (currentView === "files" && currentPath === targetPath) {
        await loadDirectory(targetPath)
      }
    } catch (e) {
      uploadState = "error"
      uploadErrors = [(e as AppError).message]
      uploadFileProgress = selectedFiles.map((file) => ({
        name: file.name,
        percent: 100,
        status: "error",
        message: (e as AppError).message,
      }))
      uploadCompletedCount = 0
      uploadFailedCount = selectedFiles.length
      uploadRemainingCount = 0
    }
  }

  // Initialize on mount
  onMount(() => {
    const initialPath = initRouter()

    // Check initial route type
    if (isSharedRoute()) {
      currentView = "shared"
      loading = false
    } else {
      currentView = "files"
      loadDirectory(initialPath)
    }

    // Subscribe to route changes
    const cleanup = onRouteChange((newPath) => {
      if (isSharedRoute()) {
        currentView = "shared"
        loading = false
      } else if (newPath !== currentPath || currentView !== "files") {
        currentView = "files"
        loadDirectory(newPath)
      }
    })

    return cleanup
  })
</script>

<div class="app">
  <header class="header">
    <div class="header-inner">
      <div class="header-top">
        <button
          type="button"
          class="title nav-link"
          onclick={() => navigateTo("/")}
        >
          📂 Files Browser
        </button>
        <nav class="nav-links">
          <button
            type="button"
            class="nav-link"
            class:active={currentView === "files"}
            onclick={() => navigateTo("/")}
          >
            <span class="nav-icon" aria-hidden="true">📁</span>
            <span class="nav-text">Browse</span>
          </button>
          <button
            type="button"
            class="nav-link"
            class:active={currentView === "shared"}
            onclick={navigateToShared}
          >
            <span class="nav-icon" aria-hidden="true">🔗</span>
            <span class="nav-text">Public Shares</span>
          </button>
        </nav>
      </div>
      {#if currentView === "files"}
        <Breadcrumbs path={currentPath} onNavigate={handleNavigate} />
      {/if}
    </div>
  </header>

  <main class="main">
    {#if currentView === "shared"}
      <SharedFilesView />
    {:else}
      <Toolbar
        search={filter.search}
        {sort}
        {uploadInProgress}
        {currentPath}
        selectedCount={selectedEntries.size}
        onSearchChange={handleSearchChange}
        onSortChange={handleSortChange}
        onUploadClick={openUploadPicker}
        onDirectoryCreated={() => loadDirectory(currentPath)}
        onCancelSelection={cancelSelectionMode}
      />

      <input
        bind:this={uploadInput}
        type="file"
        multiple
        class="visually-hidden"
        tabindex="-1"
        aria-hidden="true"
        onchange={handleUploadSelection}
      />

      {#if visibleUploadState}
        <UploadStatus
          state={visibleUploadState}
          progress={uploadProgress}
          totalFiles={uploadTotalFiles}
          totalSize={uploadTotalSize}
          targetPath={uploadTargetPath}
          uploaded={uploadUploaded}
          skipped={uploadSkipped}
          errors={uploadErrors}
          validationErrors={uploadValidationErrors}
          fileProgress={uploadFileProgress}
          completedCount={uploadCompletedCount}
          failedCount={uploadFailedCount}
          remainingCount={uploadRemainingCount}
          totalCount={uploadTotalCount}
          onDismiss={dismissUploadStatus}
        />
      {/if}

      {#if loading}
        <LoadingState message="Loading directory..." />
      {:else if error}
        <ErrorState
          icon="⚠️"
          message={error.message}
          detail={error.status ? `HTTP ${error.status}` : ""}
          onRetry={() => loadDirectory(currentPath)}
        />
      {:else}
        <FileTable
          entries={processedEntries}
          {currentPath}
          {sort}
          {isSelectionMode}
          {selectedEntries}
          onNavigate={handleNavigate}
          onSortChange={handleSortChange}
          onDelete={() => loadDirectory(currentPath)}
          onRefresh={() => loadDirectory(currentPath)}
          onSelectionModeChange={(mode: boolean) => (isSelectionMode = mode)}
          onSelectedEntriesChange={(entries: Set<string>) =>
            (selectedEntries = entries)}
        />

        <footer class="footer">
          <p class="count">
            {processedEntries.length} item{processedEntries.length !== 1
              ? "s"
              : ""}
            {#if filter.search && processedEntries.length !== entries.length}
              <span class="filtered">(filtered from {entries.length})</span>
            {/if}
          </p>
        </footer>
      {/if}
    {/if}
  </main>
</div>

<!-- Global toast notifications -->
<ToastContainer />

<style>
  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .header {
    border-bottom: 1px solid var(--color-border);
    background: var(--color-header-bg);
  }

  .header-inner {
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    padding: 1rem 1.5rem;
    box-sizing: border-box;
  }

  .header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.5rem;
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

  .title.nav-link {
    font-size: 1.5rem !important;
    font-weight: 600;
    color: var(--color-text);
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
    .header-inner {
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
    .header-inner {
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
