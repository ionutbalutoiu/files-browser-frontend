# Files Browser

A modern web UI for browsing directories served by Nginx with `autoindex_format json`.

## Prerequisites

- Node.js `>=20.19.0 <25`
- Corepack enabled (ships with Node.js)

## Features

- Browse directories with sorting and search
- Upload files with parallel queue, retry, cancel, and per-file progress
- Rename, move, and delete items
- Public file sharing
- Responsive layout with dark mode support

## Quick Start

```bash
corepack enable
corepack prepare pnpm@10.29.1 --activate
pnpm install
pnpm run dev
```

## CI and Production Installs

This repository enforces strict pnpm policy via `.npmrc` (engine checks, strict peers, controlled dependency build scripts, and release-age gating).

Use frozen, lockfile-driven installs in automation and container builds:

```bash
pnpm install --frozen-lockfile
```

## Scripts

```bash
pnpm run dev         # start Vite dev server
pnpm run check       # type + Svelte diagnostics
pnpm run test:unit   # Vitest unit/component tests
pnpm run test        # legacy URL utility test script
pnpm run build       # production build
pnpm run quality     # check + unit tests + build
pnpm run format      # prettier
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
