<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    icon?: string;
    message: string;
    hint?: string;
    children?: Snippet;
  }

  let { icon = '', message, hint = '', children }: Props = $props();
</script>

<div class="empty-state">
  {#if icon}
    <span class="icon" aria-hidden="true">{icon}</span>
  {/if}
  <p class="message">{message}</p>
  {#if hint}
    <p class="hint">{hint}</p>
  {/if}
  {#if children}
    <div class="actions">
      {@render children()}
    </div>
  {/if}
</div>

<style>
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    text-align: center;
    background: var(--color-header-bg);
    border-radius: 8px;
  }

  .icon {
    font-size: 2.5rem;
    margin-bottom: 0.75rem;
  }

  .message {
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--color-text);
    margin: 0 0 0.5rem 0;
  }

  .hint {
    color: var(--color-muted);
    margin: 0;
    font-size: 0.9rem;
    max-width: 400px;
  }

  .actions {
    margin-top: 1rem;
  }

  @media (max-width: 480px) {
    .empty-state {
      padding: 2rem 0.75rem;
    }
  }
</style>
