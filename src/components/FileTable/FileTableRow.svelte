<script lang="ts">
  import type { NginxEntry } from "../../lib/types"
  import { formatSize, formatDate } from "../../lib/format"
  import { getFileUrl, getDirectoryUrl } from "../../lib/api"
  import { getParentPath } from "../../lib/url"
  import InlineNameInput from "../shared/InlineNameInput.svelte"

  interface Props {
    entry: NginxEntry
    currentPath: string
    isMenuOpen: boolean
    isDeleting: boolean
    isRenaming: boolean
    renameValue: string
    renameError: string | null
    deleteError: string | null
    isSubmitting: boolean
    isDragging: boolean
    isDropTarget: boolean
    isParentEntry?: boolean
    onNavigate: (path: string) => void
    onMenuToggle: (entryName: string, event: MouseEvent) => void
    onRenameChange: (value: string) => void
    onRenameConfirm: () => void
    onRenameCancel: () => void
    onDragStart: (entry: NginxEntry) => void
    onDragEnd: () => void
    onDrop: (targetEntry: NginxEntry) => void
    onDragEnter: (targetEntry: NginxEntry) => void
    onDragLeave: (targetEntry: NginxEntry) => void
  }

  let {
    entry,
    currentPath,
    isMenuOpen,
    isDeleting,
    isRenaming,
    renameValue,
    renameError,
    deleteError,
    isSubmitting,
    isDragging,
    isDropTarget,
    isParentEntry = false,
    onNavigate,
    onMenuToggle,
    onRenameChange,
    onRenameConfirm,
    onRenameCancel,
    onDragStart,
    onDragEnd,
    onDrop,
    onDragEnter,
    onDragLeave,
  }: Props = $props()

  let renameInputRef: ReturnType<typeof InlineNameInput> | null = $state(null)

  function getIcon(type: "file" | "directory"): string {
    return type === "directory" ? "📁" : "📄"
  }

  function handleDirectoryClick(event: MouseEvent) {
    event.preventDefault()
    if (isParentEntry) {
      const parentPath = getParentPath(currentPath)
      onNavigate(parentPath)
    } else {
      const newPath = getDirectoryUrl(currentPath, entry.name)
      onNavigate(newPath)
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    // Don't handle navigation keys when renaming
    if (isRenaming) return

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      if (isParentEntry) {
        const parentPath = getParentPath(currentPath)
        onNavigate(parentPath)
      } else if (entry.type === "directory") {
        const newPath = getDirectoryUrl(currentPath, entry.name)
        onNavigate(newPath)
      } else {
        window.open(getFileUrl(currentPath, entry.name), "_blank")
      }
    }
  }

  function handleMenuKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      onMenuToggle(entry.name, event as unknown as MouseEvent)
    }
  }

  // Focus input when rename mode activates
  $effect(() => {
    if (isRenaming && renameInputRef) {
      renameInputRef.focus()
      if (entry.type === "file") {
        const lastDot = entry.name.lastIndexOf(".")
        if (lastDot > 0) {
          renameInputRef.setSelectionRange(0, lastDot)
        } else {
          renameInputRef.select()
        }
      } else {
        renameInputRef.select()
      }
    }
  })

  // Drag and drop handlers
  function handleDragStart(event: DragEvent) {
    if (isRenaming || isDeleting || isParentEntry) {
      event.preventDefault()
      return
    }
    event.dataTransfer?.setData("text/plain", entry.name)
    event.dataTransfer!.effectAllowed = "move"
    onDragStart(entry)
  }

  function handleDragEnd() {
    onDragEnd()
  }

  function handleDragOver(event: DragEvent) {
    // Only directories can be drop targets
    if (entry.type !== "directory") return

    event.preventDefault()
    event.dataTransfer!.dropEffect = "move"
  }

  function handleDragEnter(event: DragEvent) {
    // Only directories can be drop targets
    if (entry.type !== "directory") return

    event.preventDefault()
    onDragEnter(entry)
  }

  function handleDragLeave(event: DragEvent) {
    // Only directories can be drop targets
    if (entry.type !== "directory") return

    // Check if we're leaving to a child element (ignore those)
    const relatedTarget = event.relatedTarget as HTMLElement | null
    const currentTarget = event.currentTarget as HTMLElement
    if (relatedTarget && currentTarget.contains(relatedTarget)) return

    onDragLeave(entry)
  }

  function handleDrop(event: DragEvent) {
    // Only directories can be drop targets
    if (entry.type !== "directory") return

    event.preventDefault()
    onDrop(entry)
  }
</script>

<tr
  class="file-row"
  class:directory={entry.type === "directory"}
  class:has-error={deleteError !== null}
  class:dragging={isDragging}
  class:drop-target={isDropTarget}
  class:parent-entry={isParentEntry}
  tabindex="0"
  draggable={!isRenaming && !isDeleting && !isParentEntry}
  onkeydown={handleKeydown}
  ondragstart={handleDragStart}
  ondragend={handleDragEnd}
  ondragover={handleDragOver}
  ondragenter={handleDragEnter}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
>
  <td class="col-name">
    <span class="icon" aria-hidden="true">{getIcon(entry.type)}</span>
    {#if isRenaming}
      <InlineNameInput
        bind:this={renameInputRef}
        value={renameValue}
        disabled={isSubmitting}
        error={renameError}
        ariaLabel="New name for {entry.name}"
        cancelOnBlur={true}
        onValueChange={onRenameChange}
        onConfirm={onRenameConfirm}
        onCancel={onRenameCancel}
      />
    {:else if entry.type === "directory"}
      <a
        href="#{isParentEntry
          ? getParentPath(currentPath)
          : getDirectoryUrl(currentPath, entry.name)}"
        onclick={handleDirectoryClick}
        class="entry-link"
      >
        {entry.name}
      </a>
    {:else}
      <a
        href={getFileUrl(currentPath, entry.name)}
        target="_blank"
        rel="noopener"
        class="entry-link"
      >
        {entry.name}
      </a>
    {/if}
    {#if deleteError}
      <span class="delete-error" role="alert">{deleteError}</span>
    {/if}
    {#if renameError && !isRenaming}
      <span class="rename-error" role="alert">{renameError}</span>
    {/if}
  </td>
  <td class="col-size">
    {entry.type === "directory" ? "—" : formatSize(entry.size)}
  </td>
  <td class="col-modified">
    <span class="date-full">{formatDate(entry.mtime)}</span>
  </td>
  <td class="col-actions">
    {#if !isParentEntry}
      <div class="action-menu">
        <button
          type="button"
          class="menu-trigger"
          class:active={isMenuOpen}
          onclick={(e) => onMenuToggle(entry.name, e)}
          onkeydown={handleMenuKeydown}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          aria-label="Actions for {entry.name}"
          disabled={isDeleting}
        >
          {#if isDeleting}
            <span class="spinner-small"></span>
          {:else}
            ⋮
          {/if}
        </button>
      </div>
    {/if}
  </td>
</tr>

<style>
  .file-row {
    transition: background-color 0.1s;
  }

  .file-row:hover {
    background: var(--color-hover);
  }

  .file-row:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: -2px;
  }

  .file-row.directory {
    font-weight: 500;
  }

  .file-row.has-error {
    background: var(--color-error-bg, rgba(220, 53, 69, 0.1));
  }

  .file-row.dragging {
    opacity: 0.5;
    background: var(--color-hover);
  }

  .file-row.drop-target {
    background: var(--color-active);
    outline: 2px dashed var(--color-link);
    outline-offset: -2px;
  }

  .file-row.drop-target td {
    border-bottom-color: transparent;
  }

  .file-row[draggable="true"] {
    cursor: grab;
  }

  .file-row[draggable="true"]:active {
    cursor: grabbing;
  }

  .file-row.parent-entry {
    cursor: default;
  }

  td {
    padding: 0.6rem 1rem;
    border-bottom: 1px solid var(--color-border-light);
    vertical-align: middle;
  }

  .col-name {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 200px;
    flex-wrap: wrap;
  }

  .icon {
    flex-shrink: 0;
    font-size: 1.1rem;
  }

  .entry-link {
    color: var(--color-link);
    text-decoration: none;
    word-break: break-word;
  }

  .entry-link:hover {
    text-decoration: underline;
  }

  .entry-link:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .delete-error {
    flex-basis: 100%;
    font-size: 0.8rem;
    color: var(--color-error, #dc3545);
    margin-top: 0.25rem;
    padding-left: 1.6rem;
  }

  .col-size {
    white-space: nowrap;
    color: var(--color-muted);
    min-width: 80px;
  }

  .col-modified {
    white-space: nowrap;
    color: var(--color-muted);
    min-width: 150px;
  }

  .col-actions {
    width: 48px;
    text-align: center;
    padding: 0.4rem;
  }

  .action-menu {
    position: relative;
    display: inline-block;
  }

  .menu-trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--color-muted);
    font-size: 1.2rem;
    font-weight: bold;
    cursor: pointer;
    transition:
      background-color 0.15s,
      color 0.15s;
  }

  .menu-trigger:hover {
    background: var(--color-hover);
    color: var(--color-text);
  }

  .menu-trigger:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .menu-trigger.active {
    background: var(--color-hover);
    color: var(--color-text);
  }

  .menu-trigger:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .spinner-small {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid var(--color-border);
    border-top-color: var(--color-link);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 768px) {
    td {
      padding: 0.6rem 0.75rem;
    }

    .col-modified {
      display: none;
    }

    .col-name {
      min-width: 150px;
    }

    .col-actions {
      width: 40px;
    }
  }

  @media (max-width: 480px) {
    td {
      padding: 0.75rem 0.5rem;
    }

    .col-name {
      min-width: 120px;
      gap: 0.4rem;
    }

    .col-size {
      min-width: 55px;
      font-size: 0.8rem;
    }

    .icon {
      font-size: 1rem;
    }

    .file-row {
      min-height: 44px;
    }

    .entry-link {
      padding: 0.25rem 0;
      display: inline-block;
    }

    .menu-trigger {
      width: 40px;
      height: 40px;
    }
  }
</style>
