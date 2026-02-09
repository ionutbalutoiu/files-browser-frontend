<script lang="ts">
  interface Props {
    message: string
    onDismiss: () => void
  }

  let { message, onDismiss }: Props = $props()
</script>

<div class="delete-error" role="alert">
  <span class="delete-error-icon" aria-hidden="true">⚠️</span>
  <span class="delete-error-message">{message}</span>
  <button
    type="button"
    class="delete-error-dismiss"
    onclick={onDismiss}
    aria-label="Dismiss error"
  >
    ✕
  </button>
</div>

<style>
  .delete-error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
    background: var(--color-error-bg);
    border: 1px solid var(--color-error);
    border-radius: 8px;
  }

  .delete-error-icon {
    font-size: 1rem;
    flex-shrink: 0;
  }

  .delete-error-message {
    flex: 1;
    font-size: 0.9rem;
    color: var(--color-error);
  }

  .delete-error-dismiss {
    padding: 0.25rem 0.5rem;
    font-size: 0.85rem;
    font-family: inherit;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--color-error);
    cursor: pointer;
    transition: background 0.15s;
    flex-shrink: 0;
  }

  .delete-error-dismiss:hover {
    background: rgba(0, 0, 0, 0.1);
  }

  .delete-error-dismiss:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }
</style>
