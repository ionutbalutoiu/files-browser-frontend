<script lang="ts">
  import { onDestroy } from "svelte"
  import type { UploadSessionState } from "../../lib/stores/uploadSession.svelte"
  import UploadStatusCard from "../upload/UploadStatusCard.svelte"
  import NewFolderInput from "../NewFolderInput.svelte"

  interface Props {
    uploadInProgress: boolean
    currentPath: string
    selectedCount: number
    uploadSessionState: UploadSessionState
    onUploadClick: () => void
    onDirectoryCreated: () => void
    onCancelSelection: () => void
    onCancelUpload: () => void
    onRetryFailedUpload: () => void
    onDismissUpload: () => void
  }

  let {
    uploadInProgress,
    currentPath,
    selectedCount,
    uploadSessionState,
    onUploadClick,
    onDirectoryCreated,
    onCancelSelection,
    onCancelUpload,
    onRetryFailedUpload,
    onDismissUpload,
  }: Props = $props()

  let showNewFolder = $state(false)
  let panelEl = $state<HTMLDivElement | null>(null)
  let anchorEl = $state<HTMLButtonElement | null>(null)

  let showPanel = $derived(uploadSessionState.phase !== "hidden")
  let isUploading = $derived(uploadSessionState.phase === "uploading")

  let dismissTimer: ReturnType<typeof setTimeout> | null = null

  function startDismissTimer() {
    clearDismissTimer()
    dismissTimer = setTimeout(() => onDismissUpload(), 10_000)
  }

  function clearDismissTimer() {
    if (dismissTimer) {
      clearTimeout(dismissTimer)
      dismissTimer = null
    }
  }

  function resetDismissTimer() {
    if (showPanel && !isUploading) startDismissTimer()
  }

  function handlePanelMouseEnter() {
    clearDismissTimer()
  }

  function handlePanelMouseLeave() {
    resetDismissTimer()
  }

  function handlePanelFocusIn() {
    clearDismissTimer()
  }

  function handlePanelFocusOut() {
    resetDismissTimer()
  }

  function handleRetry() {
    clearDismissTimer()
    onRetryFailedUpload()
  }

  function handleClickOutside(event: MouseEvent) {
    if (!showPanel || isUploading) return
    const target = event.target as Node
    if (panelEl?.contains(target) || anchorEl?.contains(target)) return
    onDismissUpload()
  }

  $effect(() => {
    if (showPanel) {
      document.addEventListener("pointerdown", handleClickOutside, true)
    }
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside, true)
    }
  })

  $effect(() => {
    const phase = uploadSessionState.phase
    if (phase === "uploading") {
      clearDismissTimer()
    } else if (
      phase === "success" ||
      phase === "partial" ||
      phase === "error" ||
      phase === "cancelled" ||
      phase === "validation"
    ) {
      startDismissTimer()
    }
  })

  onDestroy(() => {
    clearDismissTimer()
  })

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
      bind:this={anchorEl}
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

{#if showPanel}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="upload-panel"
    bind:this={panelEl}
    onmouseenter={handlePanelMouseEnter}
    onmouseleave={handlePanelMouseLeave}
    onfocusin={handlePanelFocusIn}
    onfocusout={handlePanelFocusOut}
  >
    <UploadStatusCard
      sessionState={uploadSessionState}
      onCancel={onCancelUpload}
      onRetryFailed={handleRetry}
      onDismiss={onDismissUpload}
    />
  </div>
{/if}

<style>
  .action-buttons {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-left: auto;
    flex-wrap: wrap;
  }

  .upload-panel {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    z-index: 100;
    width: 480px;
    animation: slide-up 0.15s ease-out;
  }

  @keyframes slide-up {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
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

    .upload-panel {
      right: 0.5rem;
      left: 0.5rem;
      bottom: 0.5rem;
      width: auto;
    }
  }
</style>
