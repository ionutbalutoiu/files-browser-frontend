---
name: frontend
description: Claude Code rules for Svelte app frontend development (TypeScript-first, clean architecture, maintainable UI)
---

You are an expert in Svelte (SvelteKit when applicable), TypeScript, modern frontend architecture, accessibility, and performance.
You produce clean, maintainable, well-structured code that follows Svelte best practices.

## Key Principles
- Write concise, technical responses with accurate TypeScript + Svelte examples.
- Use Svelte’s reactivity idioms (derived values, `$:`) thoughtfully; keep logic readable.
- Prefer composition and modularization over duplication.
- Use descriptive variable names with auxiliary verbs (e.g., `isLoading`, `hasError`, `shouldPrefetch`).
- Prefer named exports for utilities and modules. Svelte components are files; exports inside components are typically named (`export let ...`).
- Keep components focused: presentational components render; logic lives in modules/stores/services.
- Favor progressive enhancement and accessibility by default.

## Language and Formatting
- Use TypeScript everywhere (`"strict": true`).
- Avoid enums; use `as const` objects/records instead.
- Prefer `function` for pure utilities. In Svelte files, use `function` for helpers where reasonable.
- Omit semicolons.
- Prefer explicit return types for exported functions.
- Prefer readonly where possible (`ReadonlyArray`, readonly props, immutable updates).
- Prefer early returns and guard clauses; avoid deep nesting.
- For single-line conditionals, omit braces when it improves readability.

## Svelte Reactivity Rules
- Treat `$:` as a tool, not a default.
  - Use `$:` for clear derived values and side-effect-free computations.
  - Avoid complex multi-branch `$:` blocks; extract into functions/modules.
- Avoid reactivity that hides control flow:
  - Don’t use `$:` for network calls or non-trivial side effects.
  - Use `onMount` only for browser-only work and strictly necessary side effects.
- Prefer derived values:
  - Use store `derived()` for cross-component derived state.
  - Use `$: derived = ...` for local-only derived state.

## Component Design
- Keep components small and focused. Split:
  - **UI primitives** (buttons, inputs)
  - **Composed UI** (cards, dialogs)
  - **Feature components** (domain-specific)
- Prefer slots over configuration-heavy props.
- Prefer explicit props over “magic” behavior.
- Avoid “god components”:
  - Extract helpers (formatters, mappers, validators) into `lib/` or feature `utils/`.
  - Extract domain logic into `services/` or feature modules.

### File structure inside a `.svelte` component (top to bottom)
1. `script` block:
   - imports
   - props (`export let ...`)
   - state
   - derived values (`$:`) and helpers
   - event handlers
2. markup
3. styles (if any; prefer utility classes / global design tokens)

## Project Structure
Use lowercase with dashes for directories (e.g., `components/auth-wizard`).

Recommended structure (SvelteKit-friendly):
- `src/routes/` (routing; keep route files thin)
- `src/lib/components/` (shared UI)
- `src/lib/features/<feature-name>/`
  - `components/`
  - `stores/`
  - `api/`
  - `schemas/`
  - `utils/`
- `src/lib/services/` (HTTP clients, domain services, adapters)
- `src/lib/stores/` (app-wide stores only; avoid dumping everything here)
- `src/lib/types/` (shared types only)
- `src/lib/styles/` (tokens, global styles)

Route files should orchestrate composition, not implement business logic.

## State Management and Stores
- Use stores for shared state:
  - `writable` for mutable shared state
  - `derived` for computed shared state
  - `readable` for externally-fed streams
- Prefer colocated state inside components when it’s not shared.
- Avoid prop drilling:
  - Prefer slots/composition first
  - Then stores for shared state
  - Use context (`setContext/getContext`) only for truly “tree-scoped” concerns (e.g., form context, theming).

### Store conventions
- Store modules export:
  - the store(s)
  - helper functions to update state
- Do not embed UI concerns (DOM, toasts) inside stores.

## Data Fetching
### SvelteKit (if used)
- Prefer `load` functions for route-level data and SSR where appropriate.
- Keep `load` focused:
  - validate inputs (params/search)
  - call services
  - return data
- Use `invalidate` / `invalidateAll` when needed for consistency.
- For client-only data, use browser checks and `onMount` sparingly.

### Client-side fetching (framework-agnostic)
- Centralize HTTP in `services/`:
  - `services/http/` for fetch wrapper, base URL, headers, auth, interceptors
  - `services/<domain>/` for domain calls (e.g., `services/user/get-user.ts`)
- All service functions:
  - return typed results
  - throw user-friendly errors (consistent error model)
  - never import Svelte components or DOM APIs
- Prefer RORO:
  - receive an object of params
  - return an object (data + meta when needed)

#### Example service style (conceptual)
- `getUser({ userId }): Promise<{ user: User }>`
- `listPosts({ page, pageSize }): Promise<{ posts: Post[]; total: number }>`

## Validation and Schemas
- Use Zod (or equivalent) for runtime validation at boundaries:
  - form input
  - untrusted external data (API responses when necessary)
- Keep schemas colocated with the feature in `features/*/schemas`.
- Treat types + schemas as the contract.

## Error Handling
- Use guard clauses at the beginning of functions.
- Normalize errors into a consistent `AppError` shape:
  - `message` (user-facing)
  - `code` (machine-readable)
  - `cause` (optional debug detail)
- In UI:
  - Show inline errors near inputs
  - Provide empty/error/loading states explicitly
- Avoid using `try/catch` in components for routine flow:
  - Prefer service-level normalization + predictable return shapes
  - Catch only at boundaries (routes, top-level actions) when needed

## Forms
- Prefer controlled inputs only when necessary.
- For complex forms:
  - keep input components presentational
  - move submission + validation logic to feature modules (`features/*/api` + `features/*/schemas`)
- Always:
  - show field-level validation
  - show non-field errors in a summary region
  - maintain accessible labels, descriptions, and error associations

## Styling
- Prefer a consistent system:
  - design tokens (CSS variables) + utility classes (Tailwind if used)
  - or component-scoped styles when needed
- Avoid heavy custom CSS unless it adds clear value.
- Ensure accessible focus styles and proper contrast.
- Prefer responsive, mobile-first layouts.

## Accessibility (Required)
- Always provide:
  - semantic elements (`button`, `nav`, `main`, `label`, etc.)
  - keyboard support for interactive UI
  - `aria-*` only when semantic HTML is insufficient
- Dialogs/menus/tooltips must manage focus properly (use proven libraries when possible).
- For icons:
  - decorative: `aria-hidden="true"`
  - informative: accessible name via text or `aria-label`

## Performance
- Avoid unnecessary reactive work:
  - keep `$:` blocks small and deterministic
  - don’t allocate new arrays/objects in hot reactive paths unless needed
- Use code splitting where applicable (SvelteKit route-based splitting helps by default).
- Prefer lazy loading for heavy client-only modules (editors, charts).
- Optimize images:
  - proper sizing
  - modern formats (WebP/AVIF)
  - lazy load when offscreen

## Testing and Maintainability
- Prefer unit tests for:
  - pure utilities
  - schema validation
  - store helpers (pure transformations)
- Prefer integration tests for:
  - feature flows (load → render → actions)
- Avoid snapshot-only testing; assert behavior and accessible output.

## Key Conventions
1. TypeScript strict everywhere; avoid enums (use `as const` maps).
2. Route files stay thin; business logic lives in `features/` and `services/`.
3. Centralize network calls in `services/` with typed results and consistent errors.
4. Use schemas (Zod) at boundaries (forms + untrusted external data).
5. Prefer composition + slots; avoid config-prop bloat.
6. Keep reactivity clear: derived values yes; side effects no; `onMount` sparingly.
7. Omit semicolons; use guard clauses and readable control flow.
