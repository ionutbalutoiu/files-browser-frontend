# Deployment Guide

This document explains how to deploy the Files Browser application with Nginx.

## Overview

The application consists of two parts:

1. **`/ui/`** - Static SPA assets (the built Svelte app)
2. **`/files/`** - Directory listings served by Nginx autoindex in JSON format

## Building the Application

```bash
# Install dependencies
npm install

# Build for production
npm run build
```

This generates static assets in the `dist/` directory.

## Nginx Configuration

### Basic Setup

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Serve the SPA under /ui/
    location /ui/ {
        alias /path/to/files-browser/dist/;
        try_files $uri $uri/ /ui/index.html;
    }

    # Serve directory listings under /files/
    location /files/ {
        alias /path/to/your/files/;
        
        # Enable autoindex with JSON format
        autoindex on;
        autoindex_format json;
        
        # Ensure proper content type for JSON responses
        default_type application/json;
        
        # Optional: Add CORS headers if needed
        add_header Access-Control-Allow-Origin *;
    }

    # Redirect root to /ui/
    location = / {
        return 302 /ui/;
    }
}
```

### Directory Structure Example

```
/var/www/
├── files-browser/
│   └── dist/           # Built SPA assets
│       ├── index.html
│       ├── assets/
│       └── ...
└── shared-files/       # Files to browse
    ├── documents/
    ├── photos/
    └── ...
```

### Complete Example Configuration

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name files.example.com;

    root /var/www;

    # SPA static assets
    location /ui/ {
        alias /var/www/files-browser/dist/;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # SPA fallback
        try_files $uri $uri/ /ui/index.html;
    }

    # File directory listings (JSON)
    location /files/ {
        alias /var/www/shared-files/;
        
        autoindex on;
        autoindex_format json;
        
        # Charset for filenames with special characters
        charset utf-8;
        
        # Security headers
        add_header X-Content-Type-Options nosniff;
    }

    # Root redirect
    location = / {
        return 302 /ui/;
    }

    # Security: Prevent access to hidden files
    location ~ /\. {
        deny all;
    }
}
```

## Key Points

### No Special Rewrite Rules Needed

The application uses **hash-based routing** (`#/path/to/dir/`), so:

- All UI requests go to `/ui/index.html`
- The browser handles routing client-side
- No server-side URL rewriting required for navigation

### URL Mapping

| Browser URL | Fetches |
|-------------|---------|
| `/ui/#/` | `/files/` |
| `/ui/#/photos/` | `/files/photos/` |
| `/ui/#/docs/2026/` | `/files/docs/2026/` |

### Nginx Autoindex JSON Format

Nginx returns entries like:

```json
[
  { "name": "documents", "type": "directory", "mtime": "2026-01-10T15:30:00Z" },
  { "name": "photo.jpg", "type": "file", "mtime": "2026-01-09T10:20:00Z", "size": 1048576 }
]
```

The app handles:
- Missing optional fields (`size`, `mtime`)
- Extra fields (ignored gracefully)
- Invalid JSON (shows error state)

## Development

```bash
# Run dev server
npm run dev

# Preview production build
npm run preview
```

For development, you'll need to proxy `/files/` to an Nginx instance or mock the API.

### Vite Dev Proxy Example

Add to `vite.config.ts`:

```typescript
export default defineConfig({
  // ...existing config...
  server: {
    proxy: {
      '/files': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
```

## Troubleshooting

### CORS Issues

If the UI and files are on different origins, add CORS headers:

```nginx
location /files/ {
    # ...
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, OPTIONS";
}
```

### JSON Content-Type

Ensure Nginx sends `application/json`:

```nginx
location /files/ {
    default_type application/json;
    # ...
}
```

### File Downloads Not Working

Ensure the `/files/` location allows direct file access (not just directory listings).

### Special Characters in Filenames

The app URL-encodes path segments. Ensure Nginx is configured with:

```nginx
charset utf-8;
```
