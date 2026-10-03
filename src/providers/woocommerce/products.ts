import type { ResilientHttpClient } from '../../core/http.js';
import type { UnifiedProduct, PaginatedResult } from '../../core/types.js';
import { extractWooPagination } from '../../core/pagination.js';

export function normalizeWooProduct(raw: any): UnifiedProduct {
  return {
    id: raw.id,
    name: raw.name ?? 'Unnamed',
    sku: raw.sku ?? 'N/A',
    price: parseFloat(raw.price ?? '0'),
    stock: {
      quantity: raw.stock_quantity ?? null,
      status: raw.stock_status ?? 'unknown',
    },
    categories: (raw.categories ?? []).map((c: any) => c.name),
    description: (raw.short_description ?? raw.description ?? '').replace(/<[^>]*>/g, '').trim(),
  };
}

export async function getProduct(client: ResilientHttpClient, productId: number): Promise<UnifiedProduct> {
  const res = await client.get<any>(`products/${productId}`);
  return normalizeWooProduct(res.data);
}

export async function searchProducts(
  client: ResilientHttpClient,
  params: { query?: string; sku?: string; limit?: number; page?: number }
): Promise<PaginatedResult<UnifiedProduct[]>> {
  const page = params.page ?? 1;
  const perPage = Math.min(params.limit ?? 10, 50);
  const res = await client.get<any[]>('products', {
    page, per_page: perPage, search: params.query, sku: params.sku,
  });
  return { data: res.data.map(normalizeWooProduct), pagination: extractWooPagination(res.headers, page, perPage) };
}

export async function getInventory(client: ResilientHttpClient, sku: string) {
  const res = await client.get<any[]>('products', { sku });
  if (!res.data?.length) throw new Error(`No product found with SKU: ${sku}`);
  const p = res.data[0];
  return {
    sku: p.sku,
    name: p.name,
    product_id: p.id,
    stock_status: p.stock_status,
    units_available: p.stock_quantity !== null ? p.stock_quantity : 'Untracked',
    in_stock: p.stock_status === 'instock',
  };
}
