<script lang="ts">
  import type { SortField, SortState } from "../lib/types"
  import ToolbarSearch from "./toolbar/ToolbarSearch.svelte"
  import ToolbarSortControls from "./toolbar/ToolbarSortControls.svelte"
  import ToolbarActionButtons from "./toolbar/ToolbarActionButtons.svelte"

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
</script>

<div class="toolbar">
  <ToolbarSearch {search} {onSearchChange} />
  <ToolbarSortControls {sort} {onSortChange} />
  <ToolbarActionButtons
    {uploadInProgress}
    {currentPath}
    {selectedCount}
    {onUploadClick}
    {onDirectoryCreated}
    {onCancelSelection}
  />
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

  @media (max-width: 768px) {
    .toolbar {
      flex-wrap: wrap;
      gap: 0.75rem;
    }
  }

  @media (max-width: 480px) {
    .toolbar {
      padding: 0.5rem 0;
      gap: 0.5rem;
    }
  }
</style>
