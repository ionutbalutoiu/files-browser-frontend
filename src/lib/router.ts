/**
 * Simple hash-based router for directory navigation.
 * Maps hash paths to /files/ directory structure.
 */

export type RouteChangeCallback = (path: string) => void;

let currentCallback: RouteChangeCallback | null = null;

/**
 * Get the current path from the hash.
 * Always returns a path starting and ending with '/'.
 */
export function getCurrentPath(): string {
  const hash = window.location.hash.slice(1); // Remove '#'
  
  if (!hash || hash === '/') {
    return '/';
  }

  // Decode the path segments
  let path = hash;
  
  // Ensure leading slash
  if (!path.startsWith('/')) {
    path = '/' + path;
  }

  // Ensure trailing slash for directories
  if (!path.endsWith('/')) {
    path = path + '/';
  }

  return path;
}

/**
 * Navigate to a path by updating the hash.
 */
export function navigateTo(path: string): void {
  // Ensure proper format
  let normalizedPath = path;
  
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = '/' + normalizedPath;
  }
  
  if (!normalizedPath.endsWith('/')) {
    normalizedPath = normalizedPath + '/';
  }

  // Update hash without double-encoding
  window.location.hash = normalizedPath;
}

/**
 * Parse path into breadcrumb segments.
 * Returns array of { name, path } objects.
 */
export interface BreadcrumbSegment {
  name: string;
  path: string;
}

export function parseBreadcrumbs(path: string): BreadcrumbSegment[] {
  const segments: BreadcrumbSegment[] = [
    { name: 'Home', path: '/' }
  ];

  if (path === '/') {
    return segments;
  }

  // Split path and build cumulative paths
  const parts = path.split('/').filter(Boolean);
  let cumulativePath = '/';

  for (const part of parts) {
    // Decode for display
    const decodedName = decodeURIComponent(part);
    cumulativePath += part + '/';
    
    segments.push({
      name: decodedName,
      path: cumulativePath,
    });
  }

  return segments;
}

/**
 * Subscribe to route changes.
 */
export function onRouteChange(callback: RouteChangeCallback): () => void {
  currentCallback = callback;

  const handler = () => {
    if (currentCallback) {
      currentCallback(getCurrentPath());
    }
  };

  window.addEventListener('hashchange', handler);

  // Return cleanup function
  return () => {
    window.removeEventListener('hashchange', handler);
    if (currentCallback === callback) {
      currentCallback = null;
    }
  };
}

/**
 * Initialize router with default path if needed.
 */
export function initRouter(): string {
  // Set default hash if none exists
  if (!window.location.hash || window.location.hash === '#') {
    window.location.hash = '/';
  }

  return getCurrentPath();
}
