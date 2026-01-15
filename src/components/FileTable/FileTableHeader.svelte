<script lang="ts">
  import type { SortField, SortState } from "../../lib/types"

  interface Props {
    sort: SortState
    onSortChange: (field: SortField) => void
  }

  let { sort, onSortChange }: Props = $props()

  function getSortIndicator(field: SortField): string {
    if (sort.field !== field) return ""
    return sort.direction === "asc" ? " ↑" : " ↓"
  }

  function handleClick(field: SortField) {
    onSortChange(field)
  }

  function handleKeydown(field: SortField, event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onSortChange(field)
    }
  }
</script>

<thead>
  <tr>
    <th
      scope="col"
      class="col-name sortable"
      class:sorted={sort.field === "name"}
      onclick={() => handleClick("name")}
      onkeydown={(e) => handleKeydown("name", e)}
      tabindex="0"
      role="columnheader"
      aria-sort={sort.field === "name"
        ? sort.direction === "asc"
          ? "ascending"
          : "descending"
        : "none"}
    >
      Name{getSortIndicator("name")}
    </th>
    <th
      scope="col"
      class="col-size sortable"
      class:sorted={sort.field === "size"}
      onclick={() => handleClick("size")}
      onkeydown={(e) => handleKeydown("size", e)}
      tabindex="0"
      role="columnheader"
      aria-sort={sort.field === "size"
        ? sort.direction === "asc"
          ? "ascending"
          : "descending"
        : "none"}
    >
      Size{getSortIndicator("size")}
    </th>
    <th
      scope="col"
      class="col-modified sortable"
      class:sorted={sort.field === "mtime"}
      onclick={() => handleClick("mtime")}
      onkeydown={(e) => handleKeydown("mtime", e)}
      tabindex="0"
      role="columnheader"
      aria-sort={sort.field === "mtime"
        ? sort.direction === "asc"
          ? "ascending"
          : "descending"
        : "none"}
    >
      Modified{getSortIndicator("mtime")}
    </th>
    <th scope="col" class="col-actions">
      <span class="visually-hidden">Actions</span>
    </th>
  </tr>
</thead>

<style>
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

  .col-actions {
    width: 48px;
    text-align: center;
    padding: 0.4rem;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @media (max-width: 768px) {
    th {
      padding: 0.6rem 0.75rem;
    }

    .col-modified {
      display: none;
    }

    .col-actions {
      width: 40px;
    }
  }

  @media (max-width: 480px) {
    th {
      padding: 0.75rem 0.5rem;
    }
  }
</style>
