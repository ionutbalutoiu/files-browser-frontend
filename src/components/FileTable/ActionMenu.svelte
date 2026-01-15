<script lang="ts">
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
    onShare: (entry: NginxEntry) => void
    onRename: (entry: NginxEntry) => void
    onDelete: (entry: NginxEntry) => void
  }

  let {
    entry,
    position,
    isSharing = false,
    onShare,
    onRename,
    onDelete,
  }: Props = $props()
</script>

<div
  class="menu-dropdown"
  class:open-upward={position.openUpward}
  role="menu"
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
