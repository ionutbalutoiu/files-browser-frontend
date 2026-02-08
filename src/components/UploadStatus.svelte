<script lang="ts">
  import UploadStatusCard from "./upload/UploadStatusCard.svelte"
  import type { UploadSessionState } from "../lib/stores/uploadSession.svelte"

  interface Props {
    sessionState: UploadSessionState
    onCancel: () => void
    onRetryFailed: () => void
    onDismiss: () => void
  }

  let { sessionState, onCancel, onRetryFailed, onDismiss }: Props = $props()
</script>

<UploadStatusCard {sessionState} {onCancel} {onRetryFailed} {onDismiss} />
