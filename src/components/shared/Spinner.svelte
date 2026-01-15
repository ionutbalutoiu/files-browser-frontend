<script lang="ts">
  interface Props {
    size?: "small" | "medium" | "large"
  }

  let { size = "medium" }: Props = $props()
</script>

<span
  class="spinner"
  class:small={size === "small"}
  class:medium={size === "medium"}
  class:large={size === "large"}
  aria-hidden="true"
></span>

<style>
  .spinner {
    display: inline-block;
    border-style: solid;
    border-color: var(--color-border);
    border-top-color: var(--color-link);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .small {
    width: 12px;
    height: 12px;
    border-width: 2px;
  }

  .medium {
    width: 24px;
    height: 24px;
    border-width: 3px;
  }

  .large {
    width: 32px;
    height: 32px;
    border-width: 3px;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
