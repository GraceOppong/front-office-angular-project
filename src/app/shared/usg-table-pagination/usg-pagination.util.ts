export function usgPageCount(total: number, pageSize: number): number {
  if (pageSize <= 0) {
    return 1;
  }
  return Math.max(1, Math.ceil(total / pageSize));
}

export function usgPaginateSlice<T>(items: readonly T[], page: number, pageSize: number): T[] {
  if (pageSize <= 0) {
    return [...items];
  }
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function usgRangeStart(total: number, page: number, pageSize: number): number {
  if (total === 0) {
    return 0;
  }
  return (page - 1) * pageSize + 1;
}

export function usgRangeEnd(total: number, page: number, pageSize: number): number {
  if (total === 0) {
    return 0;
  }
  return Math.min(page * pageSize, total);
}

export function usgPageNumbers(current: number, totalPages: number, maxButtons = 5): number[] {
  const pages: number[] = [];
  let start = Math.max(1, current - 2);
  let end = Math.min(totalPages, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);
  for (let p = start; p <= end; p++) {
    pages.push(p);
  }
  return pages;
}

export const USG_DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 25] as const;
