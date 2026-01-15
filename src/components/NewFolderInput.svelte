<script lang="ts">
  import { createDirectory } from "../lib/api"
  import type { AppError } from "../lib/types"

  interface Props {
    currentPath: string
    onCreated: () => void
    onCancel: () => void
  }

  let { currentPath, onCreated, onCancel }: Props = $props()

  // State
  let folderName = $state("")
  let creating = $state(false)
  let error = $state<string | null>(null)
  let inputRef = $state<HTMLInputElement | null>(null)

  // Focus input on mount
  $effect(() => {
    if (inputRef) {
      inputRef.focus()
      inputRef.select()
    }
  })

  async function handleCreate() {
    const trimmedName = folderName.trim()

    if (!trimmedName) {
      error = "Please enter a folder name"
      return
    }

    creating = true
    error = null

    try {
      await createDirectory(currentPath, trimmedName)
      onCreated()
    } catch (err) {
      error = (err as AppError).message
    } finally {
      creating = false
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      handleCreate()
    } else if (event.key === "Escape") {
      onCancel()
    }
  }
</script>

<div class="new-folder-input">
  <input
    type="text"
    bind:value={folderName}
    bind:this={inputRef}
    placeholder="Folder name"
    disabled={creating}
    onkeydown={handleKeydown}
    class="folder-name-input"
    class:has-error={error}
  />
  <button
    type="button"
    class="folder-action-btn confirm"
    onclick={handleCreate}
    disabled={creating || !folderName.trim()}
    aria-label="Create folder"
  >
    {creating ? "..." : "✓"}
  </button>
  <button
    type="button"
    class="folder-action-btn cancel"
    onclick={onCancel}
    disabled={creating}
    aria-label="Cancel"
  >
    ✕
  </button>
</div>
{#if error}
  <span class="create-error" role="alert">{error}</span>
{/if}

<style>
  .new-folder-input {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .folder-name-input {
    padding: 0.4rem 0.5rem;
    font-size: 0.85rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-input-bg);
    color: var(--color-text);
    width: 150px;
    transition: border-color 0.15s;
  }

  .folder-name-input:focus {
    outline: none;
    border-color: var(--color-focus);
    box-shadow: 0 0 0 3px var(--color-focus-ring);
  }

  .folder-name-input.has-error {
    border-color: var(--color-error, #dc3545);
  }

  .folder-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    font-size: 0.9rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-bg);
    color: var(--color-text);
    cursor: pointer;
    transition: all 0.15s;
  }

  .folder-action-btn:hover:not(:disabled) {
    background: var(--color-hover);
  }

  .folder-action-btn:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .folder-action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .folder-action-btn.confirm {
    color: var(--color-success, #28a745);
    border-color: var(--color-success, #28a745);
  }

  .folder-action-btn.confirm:hover:not(:disabled) {
    background: rgba(40, 167, 69, 0.1);
  }

  .folder-action-btn.cancel {
    color: var(--color-muted);
  }

  .create-error {
    font-size: 0.8rem;
    color: var(--color-error, #dc3545);
    white-space: nowrap;
  }

  @media (max-width: 480px) {
    .folder-name-input {
      width: 120px;
    }
  }
</style>
