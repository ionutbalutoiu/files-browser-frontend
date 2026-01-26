<script lang="ts">
  interface Props {
    value: string
    placeholder?: string
    disabled?: boolean
    error?: string | null
    ariaLabel?: string
    cancelOnBlur?: boolean
    onValueChange: (value: string) => void
    onConfirm: () => void
    onCancel: () => void
  }

  let {
    value,
    placeholder = "",
    disabled = false,
    error = null,
    ariaLabel = "Name input",
    cancelOnBlur = false,
    onValueChange,
    onConfirm,
    onCancel,
  }: Props = $props()

  let inputRef = $state<HTMLInputElement | null>(null)
  let containerRef = $state<HTMLDivElement | null>(null)
  let blurTimeoutId = $state<ReturnType<typeof setTimeout> | null>(null)

  // Cancel any pending blur timeout when error is set, and refocus the input
  $effect(() => {
    if (error && blurTimeoutId) {
      clearTimeout(blurTimeoutId)
      blurTimeoutId = null
    }
    // Refocus input when error is set and submission is complete
    if (error && !disabled) {
      inputRef?.focus()
    }
  })

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault()
      event.stopPropagation()
      onConfirm()
    } else if (event.key === "Escape") {
      event.preventDefault()
      event.stopPropagation()
      onCancel()
    } else if (event.key === " ") {
      // Allow space character - just stop propagation to prevent parent handlers
      event.stopPropagation()
    }
  }

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement
    onValueChange(target.value)
  }

  function handleBlur(event: FocusEvent) {
    if (!cancelOnBlur) return

    const relatedTarget = event.relatedTarget as HTMLElement | null
    // Don't cancel if focus moves within the component (e.g., to action buttons)
    if (relatedTarget && containerRef?.contains(relatedTarget)) {
      return
    }

    // Clear any existing timeout
    if (blurTimeoutId) {
      clearTimeout(blurTimeoutId)
    }

    // Delay to allow click events on buttons to fire first
    blurTimeoutId = setTimeout(() => {
      blurTimeoutId = null
      // Don't cancel if disabled (submitting) or if there's an error
      if (!disabled && !error) {
        onCancel()
      }
    }, 150)
  }

  function handleConfirmClick(event: MouseEvent) {
    event.stopPropagation()
    onConfirm()
  }

  function handleCancelClick(event: MouseEvent) {
    event.stopPropagation()
    onCancel()
  }

  function handleInputClick(event: MouseEvent) {
    event.stopPropagation()
  }

  export function focus() {
    inputRef?.focus()
  }

  export function select() {
    inputRef?.select()
  }

  export function setSelectionRange(start: number, end: number) {
    inputRef?.setSelectionRange(start, end)
  }
</script>

<div class="inline-name-input" bind:this={containerRef}>
  <div class="input-row">
    <input
      type="text"
      class="name-input"
      class:has-error={error !== null}
      {value}
      {placeholder}
      {disabled}
      onclick={handleInputClick}
      oninput={handleInput}
      onkeydown={handleKeydown}
      onblur={handleBlur}
      bind:this={inputRef}
      aria-label={ariaLabel}
    />
    <div class="actions">
      <button
        type="button"
        class="action-btn confirm"
        onclick={handleConfirmClick}
        disabled={disabled || !value.trim()}
        aria-label="Confirm"
      >
        {disabled ? "..." : "✓"}
      </button>
      <button
        type="button"
        class="action-btn cancel"
        onclick={handleCancelClick}
        {disabled}
        aria-label="Cancel"
      >
        ✕
      </button>
    </div>
  </div>
  {#if error}
    <span class="error-message" role="alert">{error}</span>
  {/if}
</div>

<style>
  .inline-name-input {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }

  .input-row {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .name-input {
    flex: 1;
    padding: 0.4rem 0.5rem;
    font-size: inherit;
    font-family: inherit;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-input-bg, var(--color-bg));
    color: var(--color-text);
    outline: none;
    min-width: 100px;
  }

  .name-input:focus {
    border-color: var(--color-focus);
    box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.2);
  }

  .name-input.has-error {
    border-color: var(--color-error, #dc3545);
  }

  .name-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .actions {
    display: flex;
    gap: 0.25rem;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    font-size: 0.85rem;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-bg);
    color: var(--color-text);
    cursor: pointer;
    transition: all 0.15s;
  }

  .action-btn:hover:not(:disabled) {
    background: var(--color-hover);
  }

  .action-btn:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-btn.confirm {
    color: var(--color-success, #28a745);
    border-color: var(--color-success, #28a745);
  }

  .action-btn.confirm:hover:not(:disabled) {
    background: rgba(40, 167, 69, 0.1);
  }

  .action-btn.cancel {
    color: var(--color-muted);
  }

  .error-message {
    font-size: 0.75rem;
    color: var(--color-error, #dc3545);
    margin-top: 0.2rem;
  }
</style>
