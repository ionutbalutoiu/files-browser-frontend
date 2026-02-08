<script lang="ts">
  interface Props {
    deleteError: string | null
    renameError: string | null
    isRenaming: boolean
  }

  let { deleteError, renameError, isRenaming }: Props = $props()
</script>

{#if deleteError}
  <span class="delete-error" role="alert">{deleteError}</span>
{/if}
{#if renameError && !isRenaming}
  <span class="rename-error" role="alert">{renameError}</span>
{/if}

<style>
  .delete-error,
  .rename-error {
    flex-basis: 100%;
    font-size: 0.8rem;
    color: var(--color-error);
    margin-top: 0.25rem;
    padding-left: 1.6rem;
  }
</style>
