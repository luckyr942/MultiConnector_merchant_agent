import { ResilientHttpClient } from '../../core/http.js';
import type { UnifiedProduct, PaginatedResult } from '../../core/types.js';
import { buildOffsetPagination } from '../../core/pagination.js';

export function createZohoClient(): ResilientHttpClient {
  const token = process.env.ZOHO_ACCESS_TOKEN ?? 'test_token';
  const orgId = process.env.ZOHO_ORG_ID ?? '12345';
  return new ResilientHttpClient({
    baseUrl: 'https://inventory.zoho.in/api/v1',
    auth: { type: 'bearer', token },
    extraHeaders: { 'X-com-zohocrm-organizationid': orgId },
    providerName: 'zoho',
    rateLimitRps: 5,
  });
}

function normalizeZohoItem(raw: any): UnifiedProduct {
  return {
    id: raw.item_id,
    name: raw.name ?? 'Unnamed',
    sku: raw.sku ?? 'N/A',
    price: raw.rate ?? 0,
    stock: {
      quantity: raw.actual_available_stock ?? null,
      status: raw.actual_available_stock > 0 ? 'instock' : 'outofstock',
    },
    categories: raw.category_name ? [raw.category_name] : [],
    description: raw.description ?? '',
  };
}

export async function searchZohoItems(
  client: ResilientHttpClient,
  params: { query?: string; sku?: string; page?: number; limit?: number }
): Promise<PaginatedResult<UnifiedProduct[]>> {
  const page = params.page ?? 1;
  const perPage = Math.min(params.limit ?? 10, 200);

  const res = await client.get<any>('items', {
    search_text: params.query ?? params.sku,
    page,
    per_page: perPage,
  });

  const items: UnifiedProduct[] = (res.data?.items ?? []).map(normalizeZohoItem);
  const total = res.data?.page_context?.total ?? items.length;
  return { data: items, pagination: buildOffsetPagination(page, perPage, total) };
}

export async function getZohoItem(client: ResilientHttpClient, itemId: string): Promise<UnifiedProduct> {
  const res = await client.get<any>(`items/${itemId}`);
  return normalizeZohoItem(res.data?.item ?? res.data);
}
