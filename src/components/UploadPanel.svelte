<script lang="ts">
  import {
    uploadFilesWithProgress,
    validateFiles,
    formatTotalSize,
    type UploadResult,
    type AppError,
  } from "../lib/api"

  interface Props {
    currentPath: string
    onUploadComplete: () => void
  }

  let { currentPath, onUploadComplete }: Props = $props()

  // State
  let files = $state<File[]>([])
  let uploading = $state(false)
  let progress = $state(0)
  let dragOver = $state(false)
  let result = $state<UploadResult | null>(null)
  let error = $state<string | null>(null)
  let validationErrors = $state<string[]>([])

  // Derived
  let totalSize = $derived(files.length > 0 ? formatTotalSize(files) : "")
  let canUpload = $derived(
    files.length > 0 && !uploading && validationErrors.length === 0,
  )

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement
    if (input.files) {
      setFiles(Array.from(input.files))
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault()
    dragOver = false

    if (event.dataTransfer?.files) {
      setFiles(Array.from(event.dataTransfer.files))
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault()
    dragOver = true
  }

  function handleDragLeave() {
    dragOver = false
  }

  function setFiles(newFiles: File[]) {
    files = newFiles
    result = null
    error = null
    validationErrors = validateFiles(newFiles)
  }

  function clearFiles() {
    files = []
    result = null
    error = null
    validationErrors = []
    progress = 0
  }

  function removeFile(index: number) {
    const newFiles = [...files]
    newFiles.splice(index, 1)
    setFiles(newFiles)
  }

  async function handleUpload() {
    if (!canUpload) return

    uploading = true
    progress = 0
    error = null
    result = null

    try {
      result = await uploadFilesWithProgress(files, currentPath, (p) => {
        progress = p
      })

      files = []
      validationErrors = []

      // Refresh the file list
      onUploadComplete()
    } catch (err) {
      error = (err as AppError).message
    } finally {
      uploading = false
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      ;(event.target as HTMLElement).querySelector("input")?.click()
    }
  }
</script>

<div class="upload-panel">
  <div
    class="drop-zone"
    class:drag-over={dragOver}
    class:has-files={files.length > 0}
    ondrop={handleDrop}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    onkeydown={handleKeydown}
    tabindex="0"
    role="button"
    aria-label="Drop files here or click to select"
  >
    <input
      type="file"
      multiple
      onchange={handleFileSelect}
      disabled={uploading}
      class="file-input"
      aria-hidden="true"
      tabindex="-1"
    />

    {#if files.length === 0}
      <div class="drop-prompt">
        <span class="drop-icon" aria-hidden="true">📤</span>
        <p class="drop-text">Drop files here or click to select</p>
        <p class="drop-hint">Upload to: {currentPath || "/"}</p>
      </div>
    {:else}
      <div class="file-list">
        <p class="file-summary">
          {files.length} file{files.length !== 1 ? "s" : ""} selected ({totalSize})
        </p>
        <ul>
          {#each files as file, index (file.name + index)}
            <li class="file-item">
              <span class="file-name">{file.name}</span>
              <button
                type="button"
                class="remove-btn"
                onclick={() => removeFile(index)}
                disabled={uploading}
                aria-label="Remove {file.name}"
              >
                ×
              </button>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>

  {#if validationErrors.length > 0}
    <div class="validation-errors" role="alert">
      {#each validationErrors as err}
        <p class="validation-error">⚠️ {err}</p>
      {/each}
    </div>
  {/if}

  {#if uploading}
    <div class="progress-container">
      <div class="progress-bar">
        <div class="progress-fill" style="width: {progress}%"></div>
      </div>
      <span class="progress-text">{progress}%</span>
    </div>
  {/if}

  <div class="upload-actions">
    <button
      type="button"
      class="btn btn-secondary"
      onclick={clearFiles}
      disabled={files.length === 0 || uploading}
    >
      Clear
    </button>
    <button
      type="button"
      class="btn btn-primary"
      onclick={handleUpload}
      disabled={!canUpload}
    >
      {uploading ? "Uploading..." : "Upload"}
    </button>
  </div>

  {#if error}
    <div class="upload-result error" role="alert">
      <p>❌ {error}</p>
    </div>
  {/if}

  {#if result}
    <div class="upload-result" role="status">
      {#if result.uploaded.length > 0}
        <p class="success">✓ Uploaded: {result.uploaded.join(", ")}</p>
      {/if}
      {#if result.skipped.length > 0}
        <p class="warning">
          ⚠ Skipped (already exist): {result.skipped.join(", ")}
        </p>
      {/if}
      {#if result.errors && result.errors.length > 0}
        <p class="error-text">✗ Errors: {result.errors.join(", ")}</p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .upload-panel {
    margin-top: 1rem;
    padding: 1rem;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-bg);
  }

  .drop-zone {
    position: relative;
    border: 2px dashed var(--color-border);
    border-radius: 6px;
    padding: 1.5rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: var(--color-bg);
  }

  .drop-zone:hover,
  .drop-zone:focus-visible {
    border-color: var(--color-link);
    background: var(--color-hover);
  }

  .drop-zone:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .drop-zone.drag-over {
    border-color: var(--color-link);
    background: var(--color-active);
    border-style: solid;
  }

  .drop-zone.has-files {
    text-align: left;
    cursor: default;
  }

  .file-input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }

  .drop-prompt {
    pointer-events: none;
  }

  .drop-icon {
    font-size: 2rem;
    display: block;
    margin-bottom: 0.5rem;
  }

  .drop-text {
    margin: 0 0 0.25rem 0;
    font-weight: 500;
    color: var(--color-text);
  }

  .drop-hint {
    margin: 0;
    font-size: 0.85rem;
    color: var(--color-muted);
  }

  .file-list {
    pointer-events: none;
  }

  .file-summary {
    margin: 0 0 0.75rem 0;
    font-weight: 500;
    color: var(--color-text);
  }

  .file-list ul {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 150px;
    overflow-y: auto;
  }

  .file-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.35rem 0;
    border-bottom: 1px solid var(--color-border-light);
  }

  .file-item:last-child {
    border-bottom: none;
  }

  .file-name {
    font-size: 0.9rem;
    color: var(--color-text);
    word-break: break-all;
    flex: 1;
    margin-right: 0.5rem;
  }

  .remove-btn {
    pointer-events: auto;
    background: none;
    border: none;
    font-size: 1.25rem;
    color: var(--color-muted);
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    line-height: 1;
    transition: all 0.15s;
  }

  .remove-btn:hover {
    color: var(--color-error);
    background: var(--color-hover);
  }

  .remove-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .validation-errors {
    margin-top: 0.75rem;
  }

  .validation-error {
    margin: 0.25rem 0;
    font-size: 0.85rem;
    color: var(--color-error);
  }

  .progress-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .progress-bar {
    flex: 1;
    height: 8px;
    background: var(--color-border);
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--color-link);
    transition: width 0.2s;
  }

  .progress-text {
    font-size: 0.85rem;
    color: var(--color-muted);
    min-width: 3rem;
    text-align: right;
  }

  .upload-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1rem;
    justify-content: flex-end;
  }

  .btn {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
    font-weight: 500;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .btn-secondary {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    color: var(--color-text);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--color-hover);
    border-color: var(--color-border-hover);
  }

  .btn-primary {
    background: var(--color-link);
    border: 1px solid var(--color-link);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    opacity: 0.9;
  }

  .upload-result {
    margin-top: 1rem;
    padding: 0.75rem;
    border-radius: 6px;
    font-size: 0.9rem;
  }

  .upload-result p {
    margin: 0.25rem 0;
  }

  .upload-result.error {
    background: var(--color-error-bg);
  }

  .upload-result .success {
    color: #1a7f37;
  }

  .upload-result .warning {
    color: #9a6700;
  }

  .upload-result .error-text {
    color: var(--color-error);
  }

  @media (prefers-color-scheme: dark) {
    .upload-result .success {
      color: #3fb950;
    }

    .upload-result .warning {
      color: #d29922;
    }
  }

  /* Mobile */
  @media (max-width: 480px) {
    .upload-panel {
      padding: 0.75rem;
    }

    .drop-zone {
      padding: 1rem;
    }

    .upload-actions {
      flex-direction: column;
    }

    .btn {
      width: 100%;
      padding: 0.75rem;
      min-height: 44px;
    }
  }
</style>
