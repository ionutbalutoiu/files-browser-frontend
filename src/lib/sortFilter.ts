import type { NginxEntry } from './nginxAutoindex';

export type SortField = 'name' | 'size' | 'mtime';
export type SortDirection = 'asc' | 'desc';

export interface SortState {
  field: SortField;
  direction: SortDirection;
}

export interface FilterState {
  search: string;
}

/**
 * Default sort/filter state.
 */
export const DEFAULT_SORT: SortState = {
  field: 'name',
  direction: 'asc',
};

export const DEFAULT_FILTER: FilterState = {
  search: '',
};

/**
 * Filter entries by search term (case-insensitive).
 */
export function filterEntries(entries: NginxEntry[], search: string): NginxEntry[] {
  if (!search.trim()) {
    return entries;
  }

  const term = search.toLowerCase().trim();
  return entries.filter(entry => 
    entry.name.toLowerCase().includes(term)
  );
}

/**
 * Compare function for sorting entries.
 * Always keeps directories before files.
 */
function compareEntries(a: NginxEntry, b: NginxEntry, field: SortField, direction: SortDirection): number {
  // Directories always come first
  if (a.type !== b.type) {
    return a.type === 'directory' ? -1 : 1;
  }

  let comparison = 0;

  switch (field) {
    case 'name':
      comparison = a.name.localeCompare(b.name, undefined, { 
        numeric: true, 
        sensitivity: 'base' 
      });
      break;

    case 'size':
      // Directories have no size, treat as 0
      const sizeA = a.size ?? 0;
      const sizeB = b.size ?? 0;
      comparison = sizeA - sizeB;
      break;

    case 'mtime':
      const timeA = a.mtime ? new Date(a.mtime).getTime() : 0;
      const timeB = b.mtime ? new Date(b.mtime).getTime() : 0;
      comparison = timeA - timeB;
      break;
  }

  return direction === 'asc' ? comparison : -comparison;
}

/**
 * Sort entries with directories first.
 */
export function sortEntries(entries: NginxEntry[], sort: SortState): NginxEntry[] {
  return [...entries].sort((a, b) => compareEntries(a, b, sort.field, sort.direction));
}

/**
 * Apply both filter and sort to entries.
 */
export function processEntries(
  entries: NginxEntry[], 
  filter: FilterState, 
  sort: SortState
): NginxEntry[] {
  const filtered = filterEntries(entries, filter.search);
  return sortEntries(filtered, sort);
}

/**
 * Toggle sort direction, or set to ascending if changing field.
 */
export function toggleSort(current: SortState, newField: SortField): SortState {
  if (current.field === newField) {
    return {
      field: newField,
      direction: current.direction === 'asc' ? 'desc' : 'asc',
    };
  }
  
  return {
    field: newField,
    direction: 'asc',
  };
}
