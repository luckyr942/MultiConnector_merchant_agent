import { ResilientHttpClient } from '../../core/http.js';
import type { UnifiedOrder, PaginatedResult } from '../../core/types.js';
import { maskEmail, maskPhone } from '../../core/redact.js';
import { buildOffsetPagination } from '../../core/pagination.js';

export function createUnicommerceClient(): ResilientHttpClient {
  const baseUrl = process.env.UNICOMMERCE_URL ?? 'https://yourstore.unicommerce.com';
  const token = process.env.UNICOMMERCE_TOKEN ?? 'test_token';
  return new ResilientHttpClient({
    baseUrl: `${baseUrl}/services/rest/v1`,
    auth: { type: 'bearer', token },
    providerName: 'unicommerce',
    rateLimitRps: 5,
  });
}

function normalizeUniOrder(raw: any, maskPii = true): UnifiedOrder {
  const addr = raw.addresses?.[0] ?? {};
  return {
    id: raw.code ?? raw.id,
    order_number: raw.displayOrderCode ?? raw.code ?? String(raw.id),
    provider: 'unicommerce',
    status: raw.status ?? 'unknown',
    payment: {
      status: raw.cod ? 'pending' : 'paid',
      method: raw.paymentType ?? 'unknown',
      method_title: raw.paymentType ?? 'Unknown',
    },
    financials: {
      currency: 'INR',
      total: raw.totalPrice ?? 0,
      subtotal: raw.totalPrice ?? 0,
      tax_total: raw.totalTax ?? 0,
      shipping_total: raw.shippingCharges ?? 0,
    },
    customer: {
      name: maskPii ? (addr.name ?? 'Customer').split(' ')[0] + ' ****' : (addr.name ?? 'Customer'),
      email: maskPii ? maskEmail(addr.email) : (addr.email ?? 'N/A'),
      phone: maskPii ? maskPhone(addr.phone) : (addr.phone ?? 'N/A'),
      city: addr.city,
      state: addr.state,
      country: addr.country ?? 'IN',
    },
    items: (raw.saleOrderItems ?? []).map((item: any, i: number) => ({
      id: item.itemSku ?? i,
      name: item.itemSku ?? 'Item',
      sku: item.itemSku ?? 'N/A',
      quantity: item.quantity ?? 1,
      price: item.sellingPrice ?? 0,
      total: (item.quantity ?? 1) * (item.sellingPrice ?? 0),
    })),
    created_at: raw.created ?? new Date().toISOString(),
    updated_at: raw.updated ?? new Date().toISOString(),
  };
}

export async function searchUniOrders(
  client: ResilientHttpClient,
  params: { status?: string; page?: number; limit?: number },
  maskPii = true
): Promise<PaginatedResult<UnifiedOrder[]>> {
  const page = params.page ?? 1;
  const perPage = Math.min(params.limit ?? 10, 50);

  const res = await client.get<any>('oms/orders/search', {
    status: params.status, start: (page - 1) * perPage, rows: perPage,
  });

  const orders: UnifiedOrder[] = (res.data?.elements ?? []).map((o: any) => normalizeUniOrder(o, maskPii));
  const total = res.data?.total ?? orders.length;
  return { data: orders, pagination: buildOffsetPagination(page, perPage, total) };
}

export async function getUniOrder(client: ResilientHttpClient, orderCode: string, maskPii = true): Promise<UnifiedOrder> {
  const res = await client.get<any>(`oms/orders/${orderCode}`);
  return normalizeUniOrder(res.data?.saleOrderDTO ?? res.data, maskPii);
}
