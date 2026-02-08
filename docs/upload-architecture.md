# Upload Architecture

## Boundaries

- `src/lib/api/upload.ts`
  - Upload transport and orchestration logic.
  - Supports batch upload compatibility and parallel single-file queue uploads.
  - Handles retry, cancellation, aggregated progress, per-file lifecycle states, and deterministic result ordering.
- `src/lib/stores/uploadSession.svelte.ts`
  - Upload session state machine and actions.
  - Owns lifecycle transitions (`hidden`, `validation`, `uploading`, `success`, `partial`, `error`, `cancelled`).
  - Exposes high-level actions used by UI containers.
- `src/components/upload/*`
  - Presentation-only upload status UI.
  - Renders aggregate metrics, per-file rows, final summaries, and action controls.

## Session Lifecycle

1. `startUploadSession({ files, targetPath })`
2. client validation (`validateFiles`)
3. if valid, run parallel uploader with defaults:
   - concurrency `2`
   - max retries `2`
   - base retry delay `300ms`
4. progress updates streamed to store state
5. terminal state emitted (`success` / `partial` / `error` / `cancelled`)
6. App container refreshes directory once using completion token + target-path guard

## Retry and Cancel Rules

- Retry only retryable failures (network / transient server).
- Conflict / existing file (`409`) is normalized as `skipped` and does not stop queue.
- `cancelUploadSession()` aborts active XHRs and marks queued/in-flight work as `cancelled`.

## Progress Model

- Aggregate progress:
  - `percent`, `uploadedBytes`, `totalBytes`
  - `completed`, `failed`, `cancelled`, `remaining`, `total`
- Per-file progress:
  - `queued`, `uploading`, `retrying`, `uploaded`, `skipped`, `error`, `cancelled`
  - `attempt`, optional message

## Determinism

Final `uploaded`, `skipped`, and `errors` arrays preserve original file selection order regardless of completion order.
