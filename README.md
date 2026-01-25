# 📂 Files Browser

A minimal, modern web UI for browsing directories served by Nginx with `autoindex_format json`.

![Svelte](https://img.shields.io/badge/Svelte-5-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- 🗂️ Browse directories with sorting and search
- 📤 Upload files and create folders
- ✏️ Rename, move, and delete items
- 🔗 Public file sharing
- 🌙 Dark mode support
- 📱 Mobile-friendly

## Quick Start

```bash
npm install
npm run dev      # Development server
npm run build    # Production build → dist/
```

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

## Usage

Navigate to `/ui/` — uses hash-based routing:

- `/ui/#/` — Root directory
- `/ui/#/photos/2024/` — Subdirectory
- `/ui/#/shared` — Shared files view

## Tech Stack

- **Svelte 5** with runes
- **TypeScript** strict mode
- **Vite 6** for building
- **Pure CSS** with variables

## License

MIT
