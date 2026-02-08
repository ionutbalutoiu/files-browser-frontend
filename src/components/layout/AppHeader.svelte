<script lang="ts">
  import Breadcrumbs from "../Breadcrumbs.svelte"

  interface Props {
    currentView: "files" | "shared"
    currentPath: string
    onNavigateHome: () => void
    onNavigateBrowse: () => void
    onNavigateShared: () => void
    onNavigatePath: (path: string) => void
  }

  let {
    currentView,
    currentPath,
    onNavigateHome,
    onNavigateBrowse,
    onNavigateShared,
    onNavigatePath,
  }: Props = $props()
</script>

<header class="header">
  <div class="header-inner">
    <div class="header-top">
      <button type="button" class="title nav-link" onclick={onNavigateHome}>
        📂 Files Browser
      </button>
      <nav class="nav-links">
        <button
          type="button"
          class="nav-link"
          class:active={currentView === "files"}
          onclick={onNavigateBrowse}
        >
          <span class="nav-icon" aria-hidden="true">📁</span>
          <span class="nav-text">Browse</span>
        </button>
        <button
          type="button"
          class="nav-link"
          class:active={currentView === "shared"}
          onclick={onNavigateShared}
        >
          <span class="nav-icon" aria-hidden="true">🔗</span>
          <span class="nav-text">Public Shares</span>
        </button>
      </nav>
    </div>
    {#if currentView === "files"}
      <Breadcrumbs path={currentPath} onNavigate={onNavigatePath} />
    {/if}
  </div>
</header>

<style>
  .header {
    border-bottom: 1px solid var(--color-border);
    background: var(--color-header-bg);
  }

  .header-inner {
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    padding: 1rem 1.5rem;
    box-sizing: border-box;
  }

  .header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.5rem;
  }

  .nav-links {
    display: flex;
    gap: 0.25rem;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.75rem;
    font-size: 0.85rem;
    font-family: inherit;
    border: 1px solid transparent;
    border-radius: 6px;
    background: transparent;
    color: var(--color-muted);
    cursor: pointer;
    transition: all 0.15s;
  }

  .nav-link:hover {
    background: var(--color-hover);
    color: var(--color-text);
  }

  .nav-link.active {
    background: var(--color-active);
    border-color: var(--color-active-border);
    color: var(--color-link);
  }

  .nav-link:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .title.nav-link {
    font-size: 1.5rem !important;
    font-weight: 600;
    color: var(--color-text);
  }

  .nav-icon {
    font-size: 1rem;
  }

  @media (max-width: 768px) {
    .header-inner {
      padding: 0.75rem 1rem;
    }

    .header-top {
      flex-wrap: wrap;
    }
  }

  @media (max-width: 480px) {
    .header-inner {
      padding: 0.6rem 0.75rem;
    }

    .header-top {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .title {
      font-size: 1.2rem;
    }

    .nav-links {
      width: 100%;
    }

    .nav-link {
      flex: 1;
      justify-content: center;
      padding: 0.5rem;
    }

    .nav-text {
      font-size: 0.8rem;
    }
  }
</style>
