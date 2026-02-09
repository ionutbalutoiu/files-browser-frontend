<script lang="ts">
  import { onMount } from "svelte"
  import type { NginxEntry } from "../../lib/types"

  interface MenuPosition {
    top: number
    left: number
    openUpward: boolean
  }

  interface Props {
    entry: NginxEntry
    position: MenuPosition
    isSharing?: boolean
    onClose: () => void
    onShare: (entry: NginxEntry) => void
    onRename: (entry: NginxEntry) => void
    onDelete: (entry: NginxEntry) => void
    onSelect: (entry: NginxEntry) => void
  }

  let {
    entry,
    position,
    isSharing = false,
    onClose,
    onShare,
    onRename,
    onDelete,
    onSelect,
  }: Props = $props()

  let menuRef = $state<HTMLDivElement | null>(null)

  function getMenuItems(): HTMLButtonElement[] {
    if (!menuRef) return []
    return Array.from(
      menuRef.querySelectorAll<HTMLButtonElement>(
        "button.menu-item:not(:disabled)",
      ),
    )
  }

  function focusItem(index: number) {
    const items = getMenuItems()
    if (items.length === 0) return

    const normalizedIndex =
      ((index % items.length) + items.length) % items.length
    items[normalizedIndex].focus()
  }

  function handleMenuKeydown(event: KeyboardEvent) {
    const items = getMenuItems()
    if (items.length === 0) return

    const activeIndex = items.findIndex(
      (item) => item === document.activeElement,
    )

    if (event.key === "Escape") {
      event.preventDefault()
      onClose()
      return
    }

    if (event.key === "ArrowDown") {
      event.preventDefault()
      focusItem(activeIndex + 1)
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      focusItem(activeIndex - 1)
      return
    }

    if (event.key === "Home") {
      event.preventDefault()
      focusItem(0)
      return
    }

    if (event.key === "End") {
      event.preventDefault()
      focusItem(items.length - 1)
      return
    }

    if (event.key === "Tab") {
      onClose()
    }
  }

  onMount(() => {
    queueMicrotask(() => {
      focusItem(0)
    })
  })
</script>

<div
  bind:this={menuRef}
  class="menu-dropdown"
  class:open-upward={position.openUpward}
  role="menu"
  aria-label={`Actions for ${entry.name}`}
  tabindex="-1"
  onkeydown={handleMenuKeydown}
  style="top: {position.top}px; left: {position.left}px;"
>
  {#if entry.type === "file"}
    <button
      type="button"
      class="menu-item"
      onclick={() => onShare(entry)}
      disabled={isSharing}
      role="menuitem"
    >
      {#if isSharing}
        <span class="spinner-small"></span> Sharing...
      {:else}
        🔗 Share
      {/if}
    </button>
  {/if}
  <button
    type="button"
    class="menu-item"
    onclick={() => onSelect(entry)}
    role="menuitem"
  >
    ☑️ Select
  </button>
  <button
    type="button"
    class="menu-item"
    onclick={() => onRename(entry)}
    role="menuitem"
  >
    ✏️ Rename
  </button>
  <button
    type="button"
    class="menu-item delete"
    onclick={() => onDelete(entry)}
    role="menuitem"
  >
    🗑️ Delete
  </button>
</div>

<style>
  .menu-dropdown {
    position: fixed;
    min-width: 120px;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    overflow: hidden;
    transform: translateX(-100%);
  }

  .menu-dropdown.open-upward {
    transform: translateX(-100%) translateY(-100%);
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.6rem 0.75rem;
    border: none;
    background: transparent;
    color: var(--color-text);
    font-size: 0.85rem;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.15s;
  }

  .menu-item:hover {
    background: var(--color-hover);
  }

  .menu-item:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: -2px;
  }

  .menu-item:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .menu-item.delete {
    color: var(--color-error, #dc3545);
  }

  .menu-item.delete:hover {
    background: var(--color-error-bg, rgba(220, 53, 69, 0.1));
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
</style>
