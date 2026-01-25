<script lang="ts">
  interface Props {
    title: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: "danger" | "default"
    onConfirm: () => void
    onCancel: () => void
    children?: import("svelte").Snippet
  }

  let {
    title,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "default",
    onConfirm,
    onCancel,
    children,
  }: Props = $props()

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      onCancel()
    }
  }

  function handleOverlayClick() {
    onCancel()
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="dialog-overlay"
  onclick={handleOverlayClick}
  onkeydown={handleKeydown}
  role="presentation"
>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div
    class="dialog"
    role="alertdialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
    aria-describedby="dialog-description"
    tabindex="0"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
  >
    <h2 id="dialog-title" class="dialog-title">{title}</h2>
    <div id="dialog-description" class="dialog-message">
      {#if children}
        {@render children()}
      {/if}
    </div>
    <div class="dialog-actions">
      <button type="button" class="dialog-btn cancel" onclick={onCancel}>
        {cancelLabel}
      </button>
      <button
        type="button"
        class="dialog-btn confirm"
        class:danger={variant === "danger"}
        onclick={onConfirm}
      >
        {confirmLabel}
      </button>
    </div>
  </div>
</div>

<style>
  .dialog-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
    animation: fadeIn 0.15s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .dialog {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    max-width: 400px;
    width: 100%;
    padding: 1.5rem;
    animation: slideIn 0.15s ease-out;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .dialog-title {
    margin: 0 0 0.75rem 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .dialog-message {
    margin: 0 0 1.5rem 0;
    font-size: 0.95rem;
    color: var(--color-muted);
    line-height: 1.5;
  }

  .dialog-message :global(strong) {
    color: var(--color-text);
    font-weight: 600;
    word-break: break-word;
  }

  .dialog-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
  }

  .dialog-btn {
    padding: 0.6rem 1.25rem;
    font-size: 0.9rem;
    font-weight: 500;
    border-radius: 6px;
    cursor: pointer;
    transition:
      background-color 0.15s,
      border-color 0.15s;
  }

  .dialog-btn:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .dialog-btn.cancel {
    background: transparent;
    border: 1px solid var(--color-border);
    color: var(--color-text);
  }

  .dialog-btn.cancel:hover {
    background: var(--color-hover);
    border-color: var(--color-border-hover);
  }

  .dialog-btn.confirm {
    background: var(--color-link);
    border: 1px solid var(--color-link);
    color: white;
  }

  .dialog-btn.confirm:hover {
    filter: brightness(0.9);
  }

  .dialog-btn.confirm.danger {
    background: var(--color-error, #dc3545);
    border: 1px solid var(--color-error, #dc3545);
  }

  .dialog-btn.confirm.danger:hover {
    background: var(--color-error-hover);
    border-color: var(--color-error-hover);
  }

  @media (max-width: 480px) {
    .dialog {
      padding: 1.25rem;
    }

    .dialog-actions {
      flex-direction: column-reverse;
    }

    .dialog-btn {
      width: 100%;
      padding: 0.75rem;
    }
  }
</style>
