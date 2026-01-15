# 📂 Files Browser

A minimal, modern web UI for browsing directories served by Nginx with `autoindex_format json`.

![Svelte](https://img.shields.io/badge/Svelte-5-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- 🗂️ Browse directories with a clean, responsive interface
- 🔍 Real-time search filtering
- ↕️ Sort by name, size, or date (directories always first)
- 🌙 Automatic dark mode via `prefers-color-scheme`
- 📱 Mobile-friendly with touch-optimized UI
- ⌨️ Full keyboard accessibility
- ⚡ Zero runtime dependencies

## Quick Start

```bash
npm install
npm run dev      # Start dev server
npm run build    # Build for production → dist/
```

## Deployment

The app expects:

- Static files served at `/ui/`
- Nginx autoindex JSON at `/files/`

### Nginx Configuration

```nginx
# Serve the SPA
location /ui/ {
    alias /path/to/dist/;
    try_files $uri $uri/ /ui/index.html;
}

# Serve files with JSON directory listing
location /files/ {
    alias /path/to/your/files/;
    autoindex on;
    autoindex_format json;
}
```

## Usage

Navigate to `/ui/` — the app uses hash-based routing:

- `/ui/#/` → Root directory
- `/ui/#/photos/2024/` → Subdirectory

Click directories to navigate, files to download/open.

## Tech Stack

- **Svelte 5** with runes (`$state`, `$derived`)
- **Vite 6** for building
- **TypeScript** for type safety
- **Pure CSS** with CSS variables for theming

## License

MIT
