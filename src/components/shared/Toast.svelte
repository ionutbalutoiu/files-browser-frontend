<script lang="ts">
  interface Props {
    message: string
    type: "success" | "error"
    onDismiss: () => void
  }

  let { message, type, onDismiss }: Props = $props()
</script>

<div
  class="toast"
  class:toast-success={type === "success"}
  class:toast-error={type === "error"}
  role="alert"
  aria-live="polite"
>
  <span class="toast-icon" aria-hidden="true">
    {type === "success" ? "✓" : "⚠️"}
  </span>
  <span class="toast-message">{message}</span>
  <button
    type="button"
    class="toast-dismiss"
    onclick={onDismiss}
    aria-label="Dismiss notification"
  >
    ✕
  </button>
</div>

<style>
  .toast {
    position: fixed;
    bottom: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 2000;
    max-width: calc(100vw - 2rem);
    animation: toastSlideIn 0.25s ease-out;
  }

  @keyframes toastSlideIn {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(1rem);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  .toast-success {
    background: var(--color-success-bg, #d4edda);
    border: 1px solid var(--color-success, #28a745);
    color: var(--color-success-text, #155724);
  }

  .toast-error {
    background: var(--color-error-bg, rgba(220, 53, 69, 0.1));
    border: 1px solid var(--color-error, #dc3545);
    color: var(--color-error, #dc3545);
  }

  .toast-icon {
    font-size: 1.1rem;
    flex-shrink: 0;
  }

  .toast-message {
    font-size: 0.9rem;
    line-height: 1.4;
    word-break: break-word;
  }

  .toast-dismiss {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    margin-left: auto;
    flex-shrink: 0;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: inherit;
    opacity: 0.7;
    cursor: pointer;
    font-size: 0.9rem;
    transition:
      opacity 0.15s,
      background-color 0.15s;
  }

  .toast-dismiss:hover {
    opacity: 1;
    background: rgba(0, 0, 0, 0.1);
  }

  .toast-dismiss:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }

  @media (max-width: 480px) {
    .toast {
      bottom: 1rem;
      left: 1rem;
      right: 1rem;
      transform: none;
      max-width: none;
    }

    @keyframes toastSlideIn {
      from {
        opacity: 0;
        transform: translateY(1rem);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  }
</style>
