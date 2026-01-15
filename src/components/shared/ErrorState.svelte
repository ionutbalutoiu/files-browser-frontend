<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    icon?: string
    message: string
    detail?: string
    onRetry?: () => void
    children?: Snippet
  }

  let { icon = "", message, detail = "", onRetry, children }: Props = $props()
</script>

<div class="error-state" role="alert">
  {#if icon}
    <span class="icon" aria-hidden="true">{icon}</span>
  {/if}
  <p class="message">{message}</p>
  {#if detail}
    <p class="detail">{detail}</p>
  {/if}
  {#if children}
    <div class="extra">
      {@render children()}
    </div>
  {/if}
  {#if onRetry}
    <button type="button" class="retry-button" onclick={onRetry}>
      Retry
    </button>
  {/if}
</div>

<style>
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    text-align: center;
    background: var(--color-error-bg);
    border-radius: 8px;
  }

  .icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  .message {
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--color-error);
    margin: 0 0 0.25rem 0;
  }

  .detail {
    color: var(--color-muted);
    margin: 0 0 1rem 0;
    font-size: 0.9rem;
  }

  .extra {
    color: var(--color-muted);
    margin: 0 0 1rem 0;
    font-size: 0.9rem;
    max-width: 400px;
  }

  .retry-button {
    padding: 0.5rem 1.25rem;
    font-size: 0.9rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-bg);
    color: var(--color-text);
    cursor: pointer;
    transition: all 0.15s;
  }

  .retry-button:hover {
    background: var(--color-hover);
  }

  .retry-button:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  @media (max-width: 480px) {
    .error-state {
      padding: 2rem 0.5rem;
    }

    .message {
      font-size: 1rem;
    }

    .retry-button {
      padding: 0.6rem 1.5rem;
      min-height: 44px;
    }
  }
</style>
