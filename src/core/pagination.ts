import type { PaginationInfo } from './types.js';

export function extractWooPagination(headers: Headers, page: number, perPage: number): PaginationInfo {
  return {
    page,
    per_page: perPage,
    total_items: parseInt(headers.get('x-wp-total') ?? '0', 10),
    total_pages: parseInt(headers.get('x-wp-totalpages') ?? '0', 10),
  };
}

export function buildOffsetPagination(page: number, perPage: number, totalItems: number): PaginationInfo {
  return {
    page,
    per_page: perPage,
    total_items: totalItems,
    total_pages: Math.ceil(totalItems / perPage),
  };
}
