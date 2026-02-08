<script lang="ts">
  import type {
    SortField,
    SortState,
    NginxEntry,
    AppError,
  } from "../../lib/types"
  import type { UploadSessionState } from "../../lib/stores/uploadSession.svelte"
  import Toolbar from "../Toolbar.svelte"
  import { FileTable } from "../FileTable"
  import UploadStatus from "../UploadStatus.svelte"
  import { LoadingState, ErrorState } from "../shared"

  interface Props {
    search: string
    sort: SortState
    uploadInProgress: boolean
    currentPath: string
    selectedCount: number
    loading: boolean
    error: AppError | null
    processedEntries: NginxEntry[]
    allEntriesCount: number
    uploadSessionState: UploadSessionState
    isSelectionMode: boolean
    selectedEntries: Set<string>
    onSearchChange: (search: string) => void
    onSortChange: (field: SortField) => void
    onUploadFilesSelected: (files: File[]) => void
    onDirectoryCreated: () => void
    onCancelSelection: () => void
    onNavigate: (path: string) => void
    onDelete: () => void
    onRefresh: () => void
    onSelectionModeChange: (mode: boolean) => void
    onSelectedEntriesChange: (entries: Set<string>) => void
    onCancelUpload: () => void
    onRetryFailedUpload: () => void
    onDismissUpload: () => void
  }

  let {
    search,
    sort,
    uploadInProgress,
    currentPath,
    selectedCount,
    loading,
    error,
    processedEntries,
    allEntriesCount,
    uploadSessionState,
    isSelectionMode,
    selectedEntries,
    onSearchChange,
    onSortChange,
    onUploadFilesSelected,
    onDirectoryCreated,
    onCancelSelection,
    onNavigate,
    onDelete,
    onRefresh,
    onSelectionModeChange,
    onSelectedEntriesChange,
    onCancelUpload,
    onRetryFailedUpload,
    onDismissUpload,
  }: Props = $props()

  let uploadInput = $state<HTMLInputElement | null>(null)

  let showUploadStatus = $derived(uploadSessionState.phase !== "hidden")

  function openUploadPicker() {
    if (uploadInProgress) return
    uploadInput?.click()
  }

  function handleUploadSelection(event: Event) {
    const input = event.target as HTMLInputElement
    if (!input.files || input.files.length === 0) return

    const selectedFiles = Array.from(input.files)
    input.value = ""
    onUploadFilesSelected(selectedFiles)
  }
</script>

<Toolbar
  {search}
  {sort}
  {uploadInProgress}
  {currentPath}
  {selectedCount}
  {onSearchChange}
  {onSortChange}
  onUploadClick={openUploadPicker}
  {onDirectoryCreated}
  {onCancelSelection}
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

{#if showUploadStatus}
  <UploadStatus
    sessionState={uploadSessionState}
    onCancel={onCancelUpload}
    onRetryFailed={onRetryFailedUpload}
    onDismiss={onDismissUpload}
  />
{/if}

{#if loading}
  <LoadingState message="Loading directory..." />
{:else if error}
  <ErrorState
    icon="⚠️"
    message={error.message}
    detail={error.status ? `HTTP ${error.status}` : ""}
    onRetry={onRefresh}
  />
{:else}
  <FileTable
    entries={processedEntries}
    {currentPath}
    {sort}
    {isSelectionMode}
    {selectedEntries}
    {onNavigate}
    {onSortChange}
    {onDelete}
    {onRefresh}
    {onSelectionModeChange}
    {onSelectedEntriesChange}
  />

  <footer class="footer">
    <p class="count">
      {processedEntries.length} item{processedEntries.length !== 1 ? "s" : ""}
      {#if search && processedEntries.length !== allEntriesCount}
        <span class="filtered">(filtered from {allEntriesCount})</span>
      {/if}
    </p>
  </footer>
{/if}

<style>
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

  @media (max-width: 480px) {
    .footer {
      padding: 0.75rem 0;
    }

    .count {
      font-size: 0.8rem;
    }
  }
</style>
