# Files Browser Agent Guide

## Mission and Scope

This repository is a production Svelte 5 + TypeScript frontend for browsing and managing files exposed by an Nginx backend.

All code changes must prioritize:

1. Correctness and predictable behavior
2. Type safety and maintainability
3. Accessibility and responsive UX
4. Clear architecture boundaries
5. Verifiable quality gates

## Required Read Order

Before changing code in a new session:

1. Read this file (`AGENTS.md`) fully.
2. Read `README.md` for operational commands and high-level behavior.
3. Read `docs/upload-architecture.md` when touching upload flows.
4. Read only targeted feature files after that.

## Current Stack and Architecture Map

- Framework: Svelte 5 (runes)
- Language: TypeScript (`strict: true`)
- Build: Vite 6
- Testing: Vitest + Testing Library
- Styling: global tokens/base/utilities + component-scoped styles

Primary structure:

- `src/App.svelte`: root composition and route orchestration
- `src/components/layout/*`: page-level layout composition
- `src/components/*`: feature and presentational components
- `src/lib/api/*`: transport and API/domain calls
- `src/lib/stores/*`: shared orchestration state
- `src/lib/types.ts`: shared type contracts
- `src/styles/*`: global token/base/utility layers

## Mandatory Coding Standards

### TypeScript

- Keep TypeScript strict; do not bypass with `any` unless unavoidable and justified.
- Prefer explicit return types for exported functions.
- Use guard clauses and early returns.
- Prefer immutable/readonly inputs where practical (`ReadonlyArray`).
- Avoid enums; use union types or `as const` maps.
- Keep user-facing errors normalized to `AppError` shape when crossing boundaries.

### Svelte

- Keep components focused and small; split high-complexity components.
- Containers orchestrate; presentational components render.
- Keep reactive flows explicit (`$derived`, `$effect`) and side effects localized.
- Avoid hidden control flow and heavy logic in markup.
- Use semantic HTML first; add `aria-*` only where needed.
- Ensure keyboard and focus behavior for interactive controls.

### Styling

- Reuse global tokens/utilities before duplicating styles.
- Keep shared utility classes in `src/styles/utilities.css`.
- Keep component-specific styling inside component files.
- Preserve existing responsive breakpoints unless explicitly changing UX.

## Architectural Boundaries (Enforced)

### API Layer (`src/lib/api/*`)

- Owns HTTP/XHR/fetch transport behavior and parsing.
- Returns typed results and normalized failures.
- Must not import Svelte components or mutate UI state directly.

### Store Layer (`src/lib/stores/*`)

- Owns shared state orchestration and lifecycle transitions.
- May call API modules and pure utilities.
- Must not contain direct DOM manipulation.

### Component Layer (`src/components/*`)

- Presentational and interaction wiring.
- Components should consume store/API outputs, not duplicate domain logic.
- Keep callback and prop contracts explicit.

## Upload Flow Invariants (Do Not Break)

- Parallel upload default concurrency is `2` (`DEFAULT_UPLOAD_CONCURRENCY`).
- Uploads are single-file multipart requests per worker unit.
- Retry policy defaults:
  - max retries: `2`
  - exponential backoff base delay: `300ms`
- Cancellation:
  - aborts active requests
  - marks in-flight/queued tasks as `cancelled`
- Final merged result ordering must match original file selection order.
- Existing files are filtered client-side before upload:
  - do not attach already-existing files to `FormData`
  - show as skipped
  - continue queue for remaining files

## Validation Matrix (Required)

### Docs-only changes

Run:

```bash
pnpm run format
```

### Frontend logic/UI changes

Run:

```bash
pnpm run format && pnpm run check && pnpm run test:unit && pnpm run build
```

### Large refactors / risky cross-cutting changes

Run:

```bash
pnpm run quality
```

## Operational Commands

- `corepack enable && corepack prepare pnpm@10.29.1 --activate`: bootstrap pinned pnpm
- `pnpm install --frozen-lockfile`: deterministic CI/prod dependency install
- `pnpm install --no-frozen-lockfile`: refresh lockfile intentionally when changing deps
- `pnpm run dev`: start development server
- `pnpm run check`: Svelte + TypeScript diagnostics
- `pnpm run test`: URL utility suite
- `pnpm run test:unit`: full unit/component test suite
- `pnpm run build`: production build
- `pnpm run quality`: check + test:unit + build
- `pnpm run format`: repository formatting

## API Endpoint Reference

- `GET /files/{path}`: directory listing
- `PUT /api/files?path=`: upload
- `DELETE /api/files?path=`: delete file/folder
- `POST /api/files/move`: move
- `POST /api/files/rename`: rename
- `POST /api/folders`: create folder
- `GET/POST/DELETE /api/public-shares`: sharing

## Git Hygiene and Safety

- Do not rewrite history unless explicitly requested.
- Do not run destructive commands (`reset --hard`, blanket restore) without explicit approval.
- Do not revert unrelated user changes.
- Keep commits focused and reviewable.

## Definition of Done

Before finishing, confirm all:

1. Changes follow boundaries and invariants in this guide.
2. Validation commands required by the change type pass.
3. No stale references or dead files were introduced.
4. User-visible behavior is verified for modified flows.
5. Notes to the user include what changed, where, and validation results.
