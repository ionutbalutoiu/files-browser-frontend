# Files Browser

> Svelte 5 SPA for browsing Nginx autoindex JSON directory listings.

## Required Reading

**IMPORTANT**: Before starting any work, read `.claude/rules/frontend.md` for Svelte/TypeScript coding guidelines.

---

## Tech Stack

- Svelte 5 (runes: `$state`, `$derived`, `$props`)
- TypeScript (strict)
- Vite 6
- Pure CSS (no frameworks)

## URL Structure

- App: `/ui/`
- Files API: `/files/`
- Hash routing: `/ui/#/path/to/dir/` or `/ui/#/shared`

---

## Architecture

```shell
src/
├── main.ts              # Entry point
├── app.css              # Global styles, CSS variables, themes
├── App.svelte           # Root component, state, routing
├── lib/
│   ├── types.ts         # All shared types (NginxEntry, AppError, etc.)
│   ├── constants.ts     # API endpoints, timeouts, limits
│   ├── api/             # HTTP layer (barrel export via index.ts)
│   │   ├── directory.ts # fetchDirectory, getFileUrl, getDirectoryUrl
│   │   ├── upload.ts    # uploadFilesWithProgress, validateFiles
│   │   ├── delete.ts    # deleteFile
│   │   ├── rename.ts    # renameFile
│   │   ├── mkdir.ts     # createDirectory
│   │   └── share.ts     # sharePublic, listSharePublicFiles
│   ├── router.ts        # Hash-based routing
│   ├── sortFilter.ts    # Sort/filter logic (dirs-first)
│   ├── format.ts        # formatSize, formatDate
│   ├── url.ts           # URL encoding utilities
│   ├── validators.ts    # Input validation
│   └── stores/
│       └── toast.svelte.ts  # Toast notification store
└── components/
    ├── Breadcrumbs.svelte
    ├── Toolbar.svelte
    ├── NewFolderInput.svelte
    ├── UploadPanel.svelte
    ├── SharedFilesView.svelte
    ├── FileTable/           # Barrel export via index.ts
    │   ├── FileTable.svelte
    │   ├── FileTableHeader.svelte
    │   ├── FileTableRow.svelte
    │   └── ActionMenu.svelte
    └── shared/              # Barrel export via index.ts
        ├── ConfirmDialog.svelte
        ├── EmptyState.svelte
        ├── ErrorState.svelte
        ├── LoadingState.svelte
        ├── Spinner.svelte
        ├── Toast.svelte
        ├── ToastContainer.svelte
        └── InlineNameInput.svelte
```

---

## Key Types (lib/types.ts)

```typescript
interface NginxEntry {
  name: string
  type: "file" | "directory"
  size?: number
  mtime?: string
}

interface AppError {
  message: string
  status?: number
  code?: string
  cause?: unknown
  notEnabled?: boolean
}

type SortField = "name" | "size" | "mtime"
type RouteType = "files" | "shared"
```

---

## API Endpoints (lib/constants.ts)

| Endpoint                    | Method | Purpose                  |
| --------------------------- | ------ | ------------------------ |
| `/files/{path}`             | GET    | Directory listing (JSON) |
| `/upload/{path}/`           | POST   | File upload (multipart)  |
| `/delete/{path}`            | DELETE | Delete file/folder       |
| `/rename/{path}`            | POST   | Rename file/folder       |
| `/mkdir/{path}`             | POST   | Create directory         |
| `/share-public/{path}`      | POST   | Create public share      |
| `/share-public-files/`      | GET    | List public shares       |
| `/share-public-delete/{id}` | DELETE | Remove public share      |

---

## State (App.svelte)

```typescript
let currentPath = $state("/")
let entries = $state<NginxEntry[]>([])
let loading = $state(true)
let error = $state<AppError | null>(null)
let currentView = $state<"files" | "shared">("files")
let sort = $state<SortState>({ field: "name", direction: "asc" })
let filter = $state<FilterState>({ search: "" })

let processedEntries = $derived(processEntries(entries, filter, sort))
```

---

## Core Behaviors

- **Sorting**: Directories always first, then sort by field
- **Filtering**: Case-insensitive substring match on name
- **Routing**: Hash changes trigger fetches; paths normalized with leading/trailing slashes
- **Errors**: All API errors use `AppError` type

---

## Build Commands

```bash
npm install
npm run dev      # Dev server
npm run build    # Production build → dist/
npm run preview  # Preview build
```

---

## CSS Variables

Defined in `app.css` `:root`. Dark mode via `@media (prefers-color-scheme: dark)`.

Key variables: `--color-bg`, `--color-text`, `--color-link`, `--color-hover`, `--color-border`, `--color-error`

## Responsive Breakpoints

- 768px: Tablet (hide mtime column, stack toolbar)
- 480px: Mobile (compact spacing, 44px touch targets)
