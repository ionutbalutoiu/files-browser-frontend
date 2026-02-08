<script lang="ts">
  interface Props {
    showMoveHere: boolean
    showMenu: boolean
    moveHereLabel: string
    moveHereDisabled: boolean
    isMenuOpen: boolean
    isDeleting: boolean
    menuAriaLabel: string
    onMoveHere: () => void
    onMenuToggle: (event: MouseEvent) => void
    onMenuKeydown: (event: KeyboardEvent) => void
  }

  let {
    showMoveHere,
    showMenu,
    moveHereLabel,
    moveHereDisabled,
    isMenuOpen,
    isDeleting,
    menuAriaLabel,
    onMoveHere,
    onMenuToggle,
    onMenuKeydown,
  }: Props = $props()
</script>

<td class="col-actions">
  {#if showMoveHere}
    <button
      type="button"
      class="move-here-btn"
      onclick={onMoveHere}
      aria-label={moveHereLabel}
      title="Move here"
      disabled={moveHereDisabled}
    >
      ↓
    </button>
  {:else if showMenu}
    <div class="action-menu">
      <button
        type="button"
        class="menu-trigger"
        class:active={isMenuOpen}
        onclick={onMenuToggle}
        onkeydown={onMenuKeydown}
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        aria-label={menuAriaLabel}
        disabled={isDeleting}
      >
        {#if isDeleting}
          <span class="spinner-small"></span>
        {:else}
          ⋮
        {/if}
      </button>
    </div>
  {:else}
    <span class="actions-placeholder" aria-hidden="true"></span>
  {/if}
</td>

<style>
  .col-actions {
    width: 48px;
    text-align: center;
    padding: 0.4rem;
    height: 32px;
    box-sizing: content-box;
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

  .action-menu {
    position: relative;
    display: inline-block;
  }

  .actions-placeholder {
    display: inline-block;
    width: 32px;
    height: 32px;
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
    .col-actions {
      width: 40px;
      height: 40px;
    }
  }

  @media (max-width: 480px) {
    .col-actions {
      height: 40px;
    }

    .menu-trigger,
    .move-here-btn {
      width: 40px;
      height: 40px;
    }

    .actions-placeholder {
      width: 40px;
      height: 40px;
    }
  }
</style>
