<script lang="ts">
  import type { NginxEntry } from '../lib/nginxAutoindex';
  import type { SortField, SortState } from '../lib/sortFilter';
  import { formatSize, formatDate } from '../lib/format';
  import { getFileUrl, getDirectoryUrl } from '../lib/api';

  interface Props {
    entries: NginxEntry[];
    currentPath: string;
    sort: SortState;
    onNavigate: (path: string) => void;
    onSortChange: (field: SortField) => void;
  }

  let { entries, currentPath, sort, onNavigate, onSortChange }: Props = $props();

  function handleDirectoryClick(entry: NginxEntry, event: MouseEvent) {
    event.preventDefault();
    const newPath = getDirectoryUrl(currentPath, entry.name);
    onNavigate(newPath);
  }

  function handleKeydown(entry: NginxEntry, event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (entry.type === 'directory') {
        const newPath = getDirectoryUrl(currentPath, entry.name);
        onNavigate(newPath);
      } else {
        window.open(getFileUrl(currentPath, entry.name), '_blank');
      }
    }
  }

  function getIcon(type: 'file' | 'directory'): string {
    return type === 'directory' ? '📁' : '📄';
  }

  function getSortIndicator(field: SortField): string {
    if (sort.field !== field) return '';
    return sort.direction === 'asc' ? ' ↑' : ' ↓';
  }

  function handleHeaderClick(field: SortField) {
    onSortChange(field);
  }

  function handleHeaderKeydown(field: SortField, event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSortChange(field);
    }
  }
</script>

<div class="table-container">
  <table class="file-table" role="grid">
    <thead>
      <tr>
        <th 
          scope="col" 
          class="col-name sortable"
          class:sorted={sort.field === 'name'}
          onclick={() => handleHeaderClick('name')}
          onkeydown={(e) => handleHeaderKeydown('name', e)}
          tabindex="0"
          role="columnheader"
          aria-sort={sort.field === 'name' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
        >
          Name{getSortIndicator('name')}
        </th>
        <th 
          scope="col" 
          class="col-size sortable"
          class:sorted={sort.field === 'size'}
          onclick={() => handleHeaderClick('size')}
          onkeydown={(e) => handleHeaderKeydown('size', e)}
          tabindex="0"
          role="columnheader"
          aria-sort={sort.field === 'size' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
        >
          Size{getSortIndicator('size')}
        </th>
        <th 
          scope="col" 
          class="col-modified sortable"
          class:sorted={sort.field === 'mtime'}
          onclick={() => handleHeaderClick('mtime')}
          onkeydown={(e) => handleHeaderKeydown('mtime', e)}
          tabindex="0"
          role="columnheader"
          aria-sort={sort.field === 'mtime' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
        >
          Modified{getSortIndicator('mtime')}
        </th>
      </tr>
    </thead>
    <tbody>
      {#if entries.length === 0}
        <tr class="empty-row">
          <td colspan="3">No files found</td>
        </tr>
      {:else}
        {#each entries as entry (entry.name)}
          <tr 
            class="file-row" 
            class:directory={entry.type === 'directory'}
            tabindex="0"
            onkeydown={(e) => handleKeydown(entry, e)}
          >
            <td class="col-name">
              <span class="icon" aria-hidden="true">{getIcon(entry.type)}</span>
              {#if entry.type === 'directory'}
                <a 
                  href="#{getDirectoryUrl(currentPath, entry.name)}"
                  onclick={(e) => handleDirectoryClick(entry, e)}
                  class="entry-link"
                >
                  {entry.name}
                </a>
              {:else}
                <a 
                  href={getFileUrl(currentPath, entry.name)}
                  target="_blank"
                  rel="noopener"
                  class="entry-link"
                >
                  {entry.name}
                </a>
              {/if}
            </td>
            <td class="col-size">
              {entry.type === 'directory' ? '—' : formatSize(entry.size)}
            </td>
            <td class="col-modified">
              <span class="date-full">{formatDate(entry.mtime)}</span>
            </td>
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>

<style>
  .table-container {
    overflow-x: auto;
    margin-top: 0.5rem;
  }

  .file-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }

  thead {
    position: sticky;
    top: 0;
    background: var(--color-bg);
    z-index: 1;
  }

  th {
    text-align: left;
    padding: 0.75rem 1rem;
    font-weight: 600;
    color: var(--color-text);
    border-bottom: 2px solid var(--color-border);
    white-space: nowrap;
    user-select: none;
  }

  th.sortable {
    cursor: pointer;
    transition: background-color 0.15s;
  }

  th.sortable:hover {
    background: var(--color-hover);
  }

  th.sortable:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: -2px;
  }

  th.sorted {
    color: var(--color-link);
  }

  td {
    padding: 0.6rem 1rem;
    border-bottom: 1px solid var(--color-border-light);
    vertical-align: middle;
  }

  .file-row {
    transition: background-color 0.1s;
  }

  .file-row:hover {
    background: var(--color-hover);
  }

  .file-row:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: -2px;
  }

  .file-row.directory {
    font-weight: 500;
  }

  .col-name {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 200px;
  }

  .icon {
    flex-shrink: 0;
    font-size: 1.1rem;
  }

  .entry-link {
    color: var(--color-link);
    text-decoration: none;
    word-break: break-word;
  }

  .entry-link:hover {
    text-decoration: underline;
  }

  .entry-link:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .col-size {
    white-space: nowrap;
    color: var(--color-muted);
    min-width: 80px;
  }

  .col-modified {
    white-space: nowrap;
    color: var(--color-muted);
    min-width: 150px;
  }

  .empty-row td {
    text-align: center;
    padding: 2rem;
    color: var(--color-muted);
    font-style: italic;
  }

  /* Tablet breakpoint */
  @media (max-width: 768px) {
    th, td {
      padding: 0.6rem 0.75rem;
    }

    .col-modified {
      display: none;
    }

    .col-name {
      min-width: 150px;
    }
  }

  /* Mobile breakpoint */
  @media (max-width: 480px) {
    .file-table {
      font-size: 0.85rem;
    }

    th, td {
      padding: 0.75rem 0.5rem;
    }

    .col-name {
      min-width: 120px;
      gap: 0.4rem;
    }

    .col-size {
      min-width: 55px;
      font-size: 0.8rem;
    }

    .icon {
      font-size: 1rem;
    }

    /* Better touch targets */
    .file-row {
      min-height: 44px;
    }

    .entry-link {
      padding: 0.25rem 0;
      display: inline-block;
    }
  }
</style>
