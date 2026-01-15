<script lang="ts">
  import { getToast, dismissToast } from "../../lib/stores/toast.svelte"
  import Toast from "./Toast.svelte"

  // Reactively get current toast
  let toast = $derived(getToast())
</script>

{#if toast}
  <Toast message={toast.message} type={toast.type} onDismiss={dismissToast} />
{/if}
