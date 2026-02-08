# Files Browser

A modern web UI for browsing directories served by Nginx with `autoindex_format json`.

## Features

- Browse directories with sorting and search
- Upload files with parallel queue, retry, cancel, and per-file progress
- Rename, move, and delete items
- Public file sharing
- Responsive layout with dark mode support

## Quick Start

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run dev         # start Vite dev server
npm run check       # type + Svelte diagnostics
npm run test:unit   # Vitest unit/component tests
npm run test        # legacy URL utility test script
npm run build       # production build
npm run quality     # check + unit tests + build
npm run format      # prettier
```

## Upload Behavior

- Uses single-file requests in a parallel worker pool (default concurrency: `2`)
- Continues queue when some files already exist (`skipped`)
- Retries transient failures with exponential backoff (`2` retries by default)
- Supports cancel-all via `AbortSignal`
- Tracks aggregate and per-file upload status

## Deployment

Serve static files at `/ui/` and configure Nginx:

```nginx
location /ui/ {
    alias /path/to/dist/;
    try_files $uri $uri/ /ui/index.html;
}

location /files/ {
    alias /path/to/your/files/;
    autoindex on;
    autoindex_format json;
}
```
