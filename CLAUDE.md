# Files Browser

Svelte 5 SPA for browsing Nginx autoindex JSON directories.

**Read `.claude/rules/frontend.md` before making changes.**

## Stack

Svelte 5 (runes) · TypeScript (strict) · Vite 6 · Pure CSS

## Commands

```bash
npm install && npm run dev    # Development
npm run build                 # Production → dist/
```

## URLs

- App: `/ui/#/path/to/dir/` or `/ui/#/shared`
- API: `/api/files/`, `/api/folders`, `/api/public-shares`

## Structure

```
src/
├── App.svelte           # Root: state, routing, layout
├── lib/
│   ├── types.ts         # NginxEntry, AppError, SortState, etc.
│   ├── constants.ts     # BACKEND_ENDPOINTS, timeouts
│   ├── api/             # HTTP layer (index.ts barrel)
│   ├── stores/          # Svelte stores
│   └── *.ts             # router, format, validators, url, sortFilter
└── components/
    ├── FileTable/       # Table, Header, Row, ActionMenu
    └── shared/          # ConfirmDialog, Toast, Loading/Error/EmptyState
```

## API Endpoints

| Method | Endpoint                   | Body/Query     |
| ------ | -------------------------- | -------------- |
| GET    | `/api/files/{path}`        | -              |
| PUT    | `/api/files?path=`         | multipart      |
| DELETE | `/api/files?path=`         | -              |
| POST   | `/api/files/move`          | `{from, to}`   |
| POST   | `/api/files/rename`        | `{path, name}` |
| POST   | `/api/folders`             | `{path}`       |
| GET    | `/api/public-shares`       | -              |
| POST   | `/api/public-shares`       | `{path}`       |
| DELETE | `/api/public-shares?path=` | -              |

## Key Types

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
```

## Patterns

- **Sorting**: Directories first, then by field
- **Routing**: Hash-based, paths normalized with slashes
- **Errors**: All use `AppError` type
- **CSS**: Variables in `app.css`, dark mode via `prefers-color-scheme`
