/**
 * Format bytes into human-readable size string.
 */
export function formatSize(bytes: number | undefined): string {
  if (bytes === undefined || bytes === null) {
    return '—';
  }

  if (bytes === 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  
  const size = bytes / Math.pow(1024, exponent);
  const formatted = exponent === 0 
    ? size.toString() 
    : size.toFixed(size < 10 ? 2 : 1);

  return `${formatted} ${units[exponent]}`;
}

/**
 * Format ISO date string to local datetime.
 */
export function formatDate(isoString: string | undefined): string {
  if (!isoString) {
    return '—';
  }

  try {
    const date = new Date(isoString);
    
    if (isNaN(date.getTime())) {
      return '—';
    }

    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

/**
 * Format ISO date string to a shorter format for mobile.
 */
export function formatDateShort(isoString: string | undefined): string {
  if (!isoString) {
    return '—';
  }

  try {
    const date = new Date(isoString);
    
    if (isNaN(date.getTime())) {
      return '—';
    }

    return date.toLocaleDateString(undefined, {
      year: '2-digit',
      month: 'numeric',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}
