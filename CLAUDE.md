# Files Browser - Codebase Knowledge

> A minimal Svelte 5 SPA for browsing Nginx autoindex JSON directory listings.

## Project Overview

**Purpose**: Display directory listings from Nginx `autoindex_format json` with a clean, modern UI.

**Tech Stack**:
- Svelte 5 (with runes: `$state`, `$derived`, `$props`)
- TypeScript
- Vite 6
- Pure CSS (no frameworks)

**URL Structure**:
- App served at: `/ui/`
- Files API at: `/files/`
- Hash-based routing: `/ui/#/path/to/dir/`

---

## Architecture

```
src/
├── main.ts                 # Entry point, mounts App
├── app.css                 # Global styles, CSS variables, light/dark themes
├── App.svelte              # Root component, state management, routing
├── lib/
│   ├── nginxAutoindex.ts   # Types + JSON parsing for nginx response
│   ├── api.ts              # HTTP fetching, URL building
│   ├── router.ts           # Hash-based routing utilities
│   ├── sortFilter.ts       # Sort/filter logic, always dirs-first
│   └── format.ts           # Human-readable size/date formatting
└── components/
    ├── Breadcrumbs.svelte  # Clickable path navigation
    ├── Toolbar.svelte      # Search input + sort buttons
    └── FileTable.svelte    # File/directory listing table
```

---

## Key Data Types

### Nginx Entry (from API)
```typescript
interface NginxEntry {
  name: string;
  type: 'file' | 'directory';
  size?: number;    // bytes, files only
  mtime?: string;   // ISO 8601 datetime
}
```

### Sort/Filter State
```typescript
type SortField = 'name' | 'size' | 'mtime';
type SortDirection = 'asc' | 'desc';

interface SortState {
  field: SortField;
  direction: SortDirection;
}

interface FilterState {
  search: string;  // case-insensitive filter
}
```

### Fetch Error
```typescript
interface FetchError {
  message: string;
  status?: number;
}
```

---

## Core Behaviors

### Routing
- Hash changes trigger directory fetches
- Paths always normalized with leading/trailing slashes
- `getCurrentPath()` returns current hash as path
- `navigateTo(path)` updates hash
- `parseBreadcrumbs(path)` splits into clickable segments

### API Fetching
- `fetchDirectory(path)` → fetches `/files{path}` with JSON accept header
- `getFileUrl(dir, name)` → builds download URL `/files{dir}{encodedName}`
- `getDirectoryUrl(dir, name)` → builds nav path `{dir}{encodedName}/`

### Sorting
- **Directories always come before files** regardless of sort
- Within each group: sort by field + direction
- Name sort uses `localeCompare` with `numeric: true`
- Default: name ascending

### Filtering
- Case-insensitive substring match on `entry.name`
- Applied before sorting
- Count shows filtered vs total

---

## Component Props

### Breadcrumbs
```typescript
interface Props {
  path: string;
  onNavigate: (path: string) => void;
}
```

### Toolbar
```typescript
interface Props {
  search: string;
  sort: SortState;
  onSearchChange: (search: string) => void;
  onSortChange: (field: SortField) => void;
}
```

### FileTable
```typescript
interface Props {
  entries: NginxEntry[];
  currentPath: string;
  sort: SortState;
  onNavigate: (path: string) => void;
  onSortChange: (field: SortField) => void;
}
```

---

## CSS Design System

### Color Variables (defined in `:root`)
```css
--color-bg           /* page background */
--color-header-bg    /* header background */
--color-text         /* primary text */
--color-muted        /* secondary text */
--color-link         /* links and active elements */
--color-hover        /* hover backgrounds */
--color-active       /* active/selected state */
--color-active-border
--color-border       /* primary borders */
--color-border-light /* subtle borders */
--color-border-hover
--color-focus        /* focus outline color */
--color-focus-ring   /* focus ring glow */
--color-input-bg
--color-error
--color-error-bg
```

### Dark Mode
Uses `@media (prefers-color-scheme: dark)` to override variables. No manual toggle.

### Responsive Breakpoints
- **768px**: Tablet - hide Modified column, stack toolbar
- **480px**: Mobile - compact spacing, larger touch targets (44px min)

---

## State Management (App.svelte)

```typescript
// Reactive state (Svelte 5 runes)
let currentPath = $state('/');
let entries = $state<NginxEntry[]>([]);
let loading = $state(true);
let error = $state<FetchError | null>(null);
let sort = $state<SortState>({ field: 'name', direction: 'asc' });
let filter = $state<FilterState>({ search: '' });

// Derived
let processedEntries = $derived(processEntries(entries, filter, sort));
```

Sort and filter state persist across navigation (not reset on path change).

---

## Build & Deployment

### Commands
```bash
npm install
npm run dev      # Development server
npm run build    # Production build → dist/
npm run preview  # Preview production build
```

### Vite Config
- Base path: `/ui/`
- Output: `dist/`

### Nginx Setup
```nginx
# Serve the SPA
location /ui/ {
    alias /path/to/dist/;
    try_files $uri $uri/ /ui/index.html;
}

# Serve files with JSON directory listing
location /files/ {
    alias /path/to/files/;
    autoindex on;
    autoindex_format json;
}
```

---

## Important Implementation Notes

1. **URL Encoding**: File/directory names are encoded with `encodeURIComponent()` when building URLs, decoded with `decodeURIComponent()` for display.

2. **Error Handling**: API errors throw `FetchError` objects. UI shows error state with retry button.

3. **Keyboard Navigation**: 
   - Table headers are focusable and sortable via Enter/Space
   - Table rows support Enter/Space to navigate/open
   - All interactive elements have `:focus-visible` styles

4. **Loading State**: Shows spinner during fetch. Entries cleared immediately on navigation to prevent stale data flash.

5. **Empty State**: Shows "No files found" when directory is empty or all filtered out.

6. **Mobile Optimizations**:
   - 16px input font prevents iOS zoom
   - Safe area insets for notched devices
   - Hidden Modified column below 768px
   - 44px minimum touch targets

---

## File-by-File Summary

| File | Purpose | Key Exports |
|------|---------|-------------|
| `main.ts` | Bootstrap | Mounts App to `#app` |
| `app.css` | Global styles | CSS variables, reset, dark mode |
| `App.svelte` | Root component | State, routing integration, layout |
| `lib/nginxAutoindex.ts` | Types | `NginxEntry`, `parseNginxResponse()` |
| `lib/api.ts` | HTTP layer | `fetchDirectory()`, `getFileUrl()`, `getDirectoryUrl()` |
| `lib/router.ts` | Routing | `initRouter()`, `navigateTo()`, `onRouteChange()`, `parseBreadcrumbs()` |
| `lib/sortFilter.ts` | Data processing | `processEntries()`, `toggleSort()`, types |
| `lib/format.ts` | Formatting | `formatSize()`, `formatDate()` |
| `Breadcrumbs.svelte` | Navigation UI | Path segments as links |
| `Toolbar.svelte` | Controls | Search input, sort buttons |
| `FileTable.svelte` | Main listing | Sortable table, file/dir links |

---

## Common Modification Patterns

### Add a new sort field
1. Add to `SortField` type in `sortFilter.ts`
2. Add case to `compareEntries()` function
3. Add button in `Toolbar.svelte` sort controls
4. Add column header in `FileTable.svelte`

### Add a new display column
1. Add to table header `<thead>` in `FileTable.svelte`
2. Add `<td>` in entry row
3. Add responsive hiding if needed in media queries

### Modify color scheme
1. Update CSS variables in `app.css` `:root` block
2. Update dark mode overrides in `@media (prefers-color-scheme: dark)`

### Add feature flag / setting
1. Add state in `App.svelte`
2. Pass as prop to relevant components
3. Consider persisting to localStorage

---

## Dependencies (minimal)

```json
{
  "@sveltejs/vite-plugin-svelte": "^5.0.3",
  "@tsconfig/svelte": "^5.0.4",
  "svelte": "^5.16.0",
  "svelte-check": "^4.1.1",
  "typescript": "^5.7.2",
  "vite": "^6.0.6"
}
```

No runtime dependencies. No UI frameworks.
