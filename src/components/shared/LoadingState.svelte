<script lang="ts">
  import Spinner from './Spinner.svelte';

  interface Props {
    message?: string;
  }

  let { message = 'Loading...' }: Props = $props();
</script>

<div class="loading-state">
  <Spinner size="large" />
  <p>{message}</p>
</div>

<style>
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    text-align: center;
    color: var(--color-muted);
  }

  p {
    margin: 1rem 0 0 0;
  }

  @media (max-width: 480px) {
    .loading-state {
      padding: 2rem 0.5rem;
    }
  }
</style>
