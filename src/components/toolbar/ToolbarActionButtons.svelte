<script lang="ts">
  import NewFolderInput from "../NewFolderInput.svelte"

  interface Props {
    uploadInProgress: boolean
    currentPath: string
    selectedCount: number
    onUploadClick: () => void
    onDirectoryCreated: () => void
    onCancelSelection: () => void
  }

  let {
    uploadInProgress,
    currentPath,
    selectedCount,
    onUploadClick,
    onDirectoryCreated,
    onCancelSelection,
  }: Props = $props()

  let showNewFolder = $state(false)

  function handleFolderCreated() {
    showNewFolder = false
    onDirectoryCreated()
  }
</script>

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

<style>
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

  @media (max-width: 768px) {
    .action-buttons {
      order: 3;
      margin-left: 0;
    }
  }

  @media (max-width: 480px) {
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
