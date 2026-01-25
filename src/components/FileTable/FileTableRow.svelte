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
    isSelectionMode?: boolean
    isSelected?: boolean
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
    onToggleSelect?: (entry: NginxEntry) => void
    onMoveHere?: (targetEntry: NginxEntry) => void
    onLongPress?: (entry: NginxEntry) => void
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
    isSelectionMode = false,
    isSelected = false,
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
    onToggleSelect,
    onMoveHere,
    onLongPress,
  }: Props = $props()

  let renameInputRef: ReturnType<typeof InlineNameInput> | null = $state(null)

  function getIcon(type: "file" | "directory"): string {
    return type === "directory" ? "📁" : "📄"
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

  // Long press handling for mobile and desktop
  const LONG_PRESS_DURATION = 500
  let longPressTimer: ReturnType<typeof setTimeout> | null = null
  let pressStartPos = { x: 0, y: 0 }
  let longPressTriggered = false

  function startLongPress(clientX: number, clientY: number) {
    if (isParentEntry || isSelectionMode || isRenaming || isDeleting) return

    pressStartPos = { x: clientX, y: clientY }
    longPressTriggered = false

    longPressTimer = setTimeout(() => {
      longPressTriggered = true
      onLongPress?.(entry)
      longPressTimer = null
    }, LONG_PRESS_DURATION)
  }

  function moveLongPress(clientX: number, clientY: number) {
    if (!longPressTimer) return

    const dx = clientX - pressStartPos.x
    const dy = clientY - pressStartPos.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Cancel long press if moved too much
    if (distance > 10) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
  }

  function endLongPress() {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
  }

  // Touch event handlers
  function handleTouchStart(event: TouchEvent) {
    const touch = event.touches[0]
    startLongPress(touch.clientX, touch.clientY)
  }

  function handleTouchMove(event: TouchEvent) {
    const touch = event.touches[0]
    moveLongPress(touch.clientX, touch.clientY)
  }

  function handleTouchEnd() {
    endLongPress()
  }

  // Mouse event handlers for desktop long press
  function handleMouseDown(event: MouseEvent) {
    // Only handle left click, ignore if on interactive elements
    if (event.button !== 0) return
    const target = event.target as HTMLElement
    if (target.closest(".move-here-btn") || target.closest(".menu-trigger"))
      return

    startLongPress(event.clientX, event.clientY)
  }

  function handleMouseMove(event: MouseEvent) {
    moveLongPress(event.clientX, event.clientY)
  }

  function handleMouseUp() {
    endLongPress()
  }

  function handleRowClick(event: MouseEvent) {
    // Don't handle if long press was just triggered
    if (longPressTriggered) {
      longPressTriggered = false
      return
    }

    // Don't handle if clicking on interactive elements
    const target = event.target as HTMLElement
    if (target.closest(".move-here-btn") || target.closest(".menu-trigger"))
      return

    // In selection mode, toggle selection (except for parent entry)
    if (isSelectionMode && !isParentEntry) {
      onToggleSelect?.(entry)
      return
    }

    // Navigate to directory or open file
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
</script>

<tr
  class="file-row"
  class:directory={entry.type === "directory"}
  class:has-error={deleteError !== null}
  class:dragging={isDragging}
  class:drop-target={isDropTarget}
  class:parent-entry={isParentEntry}
  class:selected={isSelected}
  class:selection-mode={isSelectionMode}
  tabindex="0"
  draggable={!isRenaming && !isDeleting && !isParentEntry && !isSelectionMode}
  onkeydown={handleKeydown}
  ondragstart={handleDragStart}
  ondragend={handleDragEnd}
  ondragover={handleDragOver}
  ondragenter={handleDragEnter}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
  ontouchstart={handleTouchStart}
  ontouchmove={handleTouchMove}
  ontouchend={handleTouchEnd}
  ontouchcancel={handleTouchEnd}
  onmousedown={handleMouseDown}
  onmousemove={handleMouseMove}
  onmouseup={handleMouseUp}
  onmouseleave={handleMouseUp}
  onclick={handleRowClick}
>
  <td class="col-name">
    <div class="name-content">
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
      {:else}
        <span class="entry-name">{entry.name}</span>
      {/if}
      {#if deleteError}
        <span class="delete-error" role="alert">{deleteError}</span>
      {/if}
      {#if renameError && !isRenaming}
        <span class="rename-error" role="alert">{renameError}</span>
      {/if}
    </div>
  </td>
  <td class="col-size">
    {entry.type === "directory" ? "—" : formatSize(entry.size)}
  </td>
  <td class="col-modified">
    <span class="date-full">{formatDate(entry.mtime)}</span>
  </td>
  <td class="col-actions">
    {#if isSelectionMode && entry.type === "directory"}
      <button
        type="button"
        class="move-here-btn"
        onclick={() => onMoveHere?.(entry)}
        aria-label="Move selected items to {isParentEntry
          ? 'parent folder'
          : entry.name}"
        title="Move here"
        disabled={isSelected}
      >
        ↓
      </button>
    {:else if !isParentEntry && !isSelectionMode}
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
    -webkit-user-select: none;
    user-select: none;
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

  .file-row.selected {
    background: var(--color-selected-bg, rgba(0, 123, 255, 0.15));
    box-shadow: inset 3px 0 0 var(--color-link);
  }

  .file-row:not(.parent-entry) {
    cursor: pointer;
  }

  td {
    padding: 0.6rem 1rem;
    border-bottom: 1px solid var(--color-border-light);
    vertical-align: middle;
  }

  .move-here-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 1px solid var(--color-link);
    border-radius: 4px;
    background: transparent;
    color: var(--color-link);
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition:
      background-color 0.15s,
      color 0.15s;
  }

  .move-here-btn:hover {
    background: var(--color-link);
    color: var(--color-bg);
  }

  .move-here-btn:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .move-here-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    border-color: var(--color-muted);
    color: var(--color-muted);
  }

  .move-here-btn:disabled:hover {
    background: transparent;
    color: var(--color-muted);
  }

  .col-name {
    min-width: 200px;
  }

  .name-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .icon {
    flex-shrink: 0;
    font-size: 1.1rem;
  }

  .entry-name {
    color: var(--color-link);
    word-break: break-word;
  }

  .file-row:not(.selection-mode):hover .entry-name {
    text-decoration: underline;
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
    height: 32px;
    box-sizing: content-box;
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

    .name-content {
      gap: 0.5rem;
    }

    .col-actions {
      width: 40px;
      height: 40px;
    }
  }

  @media (max-width: 480px) {
    td {
      padding: 0.75rem 0.5rem;
    }

    .col-name {
      min-width: 120px;
    }

    .name-content {
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

    .col-actions {
      height: 40px;
    }

    .menu-trigger,
    .move-here-btn {
      width: 40px;
      height: 40px;
    }
  }
</style>
