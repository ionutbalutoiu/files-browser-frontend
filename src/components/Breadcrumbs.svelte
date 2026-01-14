<script lang="ts">
  import { parseBreadcrumbs } from '../lib/router';
  import type { BreadcrumbSegment } from '../lib/types';

  interface Props {
    path: string;
    onNavigate: (path: string) => void;
  }

  let { path, onNavigate }: Props = $props();

  let segments: BreadcrumbSegment[] = $derived(parseBreadcrumbs(path));

  function handleClick(segment: BreadcrumbSegment, event: MouseEvent) {
    event.preventDefault();
    onNavigate(segment.path);
  }

  function handleKeydown(segment: BreadcrumbSegment, event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onNavigate(segment.path);
    }
  }
</script>

<nav class="breadcrumbs" aria-label="Directory path">
  <ol>
    {#each segments as segment, index}
      <li>
        {#if index < segments.length - 1}
          <a 
            href="#{segment.path}"
            onclick={(e) => handleClick(segment, e)}
            onkeydown={(e) => handleKeydown(segment, e)}
          >
            {segment.name}
          </a>
          <span class="separator" aria-hidden="true">/</span>
        {:else}
          <span class="current" aria-current="page">{segment.name}</span>
        {/if}
      </li>
    {/each}
  </ol>
</nav>

<style>
  .breadcrumbs {
    padding: 0.5rem 0;
  }

  ol {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem;
  }

  li {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  a {
    color: var(--color-link);
    text-decoration: none;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    transition: background-color 0.15s;
  }

  a:hover {
    background-color: var(--color-hover);
    text-decoration: underline;
  }

  a:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .separator {
    color: var(--color-muted);
    user-select: none;
  }

  .current {
    color: var(--color-text);
    font-weight: 500;
    padding: 0.25rem 0.5rem;
  }

  /* Mobile breakpoint */
  @media (max-width: 480px) {
    .breadcrumbs {
      padding: 0.25rem 0;
    }

    ol {
      gap: 0.15rem;
    }

    a {
      padding: 0.35rem 0.4rem;
      font-size: 0.9rem;
      min-height: 32px;
      display: inline-flex;
      align-items: center;
    }

    .current {
      padding: 0.35rem 0.4rem;
      font-size: 0.9rem;
      word-break: break-word;
    }

    .separator {
      font-size: 0.85rem;
    }
  }
</style>
