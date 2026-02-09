<script lang="ts">
  import type { NginxEntry } from "../../lib/types"
  import { formatSize, formatDate } from "../../lib/format"
  import { getFileUrl, getDirectoryUrl } from "../../lib/api"
  import { getParentPath } from "../../lib/url"
  import InlineNameInput from "../shared/InlineNameInput.svelte"
  import FileRowActions from "./FileRowActions.svelte"
  import FileRowStatusMessages from "./FileRowStatusMessages.svelte"

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

  let showMoveHere = $derived(isSelectionMode && entry.type === "directory")
  let showMenu = $derived(!isParentEntry && !isSelectionMode)
  let moveHereLabel = $derived(
    `Move selected items to ${isParentEntry ? "parent folder" : entry.name}`,
  )
  let menuAriaLabel = $derived(`Actions for ${entry.name}`)

  function getIcon(type: "file" | "directory"): string {
    return type === "directory" ? "📁" : "📄"
  }

  function isInteractiveTarget(target: EventTarget | null): boolean {
    const element = target as HTMLElement | null
    if (!element) return false
    return (
      element.closest(
        "button, input, select, textarea, a, [contenteditable='true'], [role='button']",
      ) !== null
    )
  }

  function openFileInNewTab(path: string) {
    window.open(path, "_blank", "noopener,noreferrer")
  }

  function navigateEntry() {
    if (isParentEntry) {
      const parentPath = getParentPath(currentPath)
      onNavigate(parentPath)
      return
    }

    if (entry.type === "directory") {
      const newPath = getDirectoryUrl(currentPath, entry.name)
      onNavigate(newPath)
      return
    }

    openFileInNewTab(getFileUrl(currentPath, entry.name))
  }

  function handleKeydown(event: KeyboardEvent) {
    if (isRenaming) return
    if (event.currentTarget !== event.target) return
    if (isInteractiveTarget(event.target)) return

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      if (isSelectionMode && !isParentEntry) {
        onToggleSelect?.(entry)
        return
      }

      navigateEntry()
    }
  }

  function handleMenuToggle(event: MouseEvent) {
    onMenuToggle(entry.name, event)
  }

  function handleMenuKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault()
      onMenuToggle(entry.name, new MouseEvent("click"))
    }
  }

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

  function handleDragStart(event: DragEvent) {
    if (isRenaming || isDeleting || isParentEntry) {
      event.preventDefault()
      return
    }

    const dataTransfer = event.dataTransfer
    if (!dataTransfer) return

    dataTransfer.setData("text/plain", entry.name)
    dataTransfer.effectAllowed = "move"
    onDragStart(entry)
  }

  function handleDragEnd() {
    onDragEnd()
  }

  function handleDragOver(event: DragEvent) {
    if (entry.type !== "directory") return

    const dataTransfer = event.dataTransfer
    if (!dataTransfer) return

    event.preventDefault()
    dataTransfer.dropEffect = "move"
  }

  function handleDragEnter(event: DragEvent) {
    if (entry.type !== "directory") return

    event.preventDefault()
    onDragEnter(entry)
  }

  function handleDragLeave(event: DragEvent) {
    if (entry.type !== "directory") return

    const relatedTarget = event.relatedTarget as HTMLElement | null
    const currentTarget = event.currentTarget as HTMLElement
    if (relatedTarget && currentTarget.contains(relatedTarget)) return

    onDragLeave(entry)
  }

  function handleDrop(event: DragEvent) {
    if (entry.type !== "directory") return

    event.preventDefault()
    onDrop(entry)
  }

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
    if (distance > 10) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
  }

  function endLongPress() {
    if (!longPressTimer) return
    clearTimeout(longPressTimer)
    longPressTimer = null
  }

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

  function handleMouseDown(event: MouseEvent) {
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
    if (longPressTriggered) {
      longPressTriggered = false
      return
    }

    const target = event.target as HTMLElement
    if (target.closest(".move-here-btn") || target.closest(".menu-trigger"))
      return
    if (isInteractiveTarget(target)) return

    if (isSelectionMode && !isParentEntry) {
      onToggleSelect?.(entry)
      return
    }

    navigateEntry()
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
      <FileRowStatusMessages {deleteError} {renameError} {isRenaming} />
    </div>
  </td>
  <td class="col-size">
    {entry.type === "directory" ? "—" : formatSize(entry.size)}
  </td>
  <td class="col-modified">
    <span class="date-full">{formatDate(entry.mtime)}</span>
  </td>
  <FileRowActions
    {showMoveHere}
    {showMenu}
    {isMenuOpen}
    {isDeleting}
    {moveHereLabel}
    moveHereDisabled={isSelected}
    {menuAriaLabel}
    onMoveHere={() => onMoveHere?.(entry)}
    onMenuToggle={handleMenuToggle}
    onMenuKeydown={handleMenuKeydown}
  />
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
    background: var(--color-selected-bg);
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
  }
</style>
