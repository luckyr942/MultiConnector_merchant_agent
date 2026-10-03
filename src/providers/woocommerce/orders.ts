import type { ResilientHttpClient } from '../../core/http.js';
import type { UnifiedOrder, PaginatedResult, PaymentStatus } from '../../core/types.js';
import { maskEmail, maskPhone, maskAddress } from '../../core/redact.js';
import { extractWooPagination } from '../../core/pagination.js';

function derivePaymentStatus(raw: any): PaymentStatus {
  if (raw.status === 'completed' || raw.date_paid) return 'paid';
  if (raw.status === 'failed') return 'failed';
  if (raw.status === 'refunded') return 'refunded';
  if (raw.status === 'pending' || raw.status === 'on-hold') return 'pending';
  return 'unknown';
}

export function normalizeWooOrder(raw: any, maskPii = true): UnifiedOrder {
  return {
    id: raw.id,
    order_number: raw.number ?? String(raw.id),
    provider: 'woocommerce',
    status: raw.status,
    payment: {
      status: derivePaymentStatus(raw),
      method: raw.payment_method ?? 'unknown',
      method_title: raw.payment_method_title ?? 'Unknown',
      transaction_id: raw.transaction_id || undefined,
    },
    financials: {
      currency: raw.currency ?? 'INR',
      total: parseFloat(raw.total ?? '0'),
      subtotal: parseFloat(raw.subtotal ?? raw.total ?? '0'),
      tax_total: parseFloat(raw.total_tax ?? '0'),
      shipping_total: parseFloat(raw.shipping_total ?? '0'),
    },
    customer: {
      name: `${raw.billing?.first_name ?? 'Guest'} ${raw.billing?.last_name ?? ''}`.trim(),
      email: maskPii ? maskEmail(raw.billing?.email) : (raw.billing?.email ?? 'N/A'),
      phone: maskPii ? maskPhone(raw.billing?.phone) : (raw.billing?.phone ?? 'N/A'),
      city: raw.billing?.city,
      state: raw.billing?.state,
      country: raw.billing?.country,
    },
    items: (raw.line_items ?? []).map((li: any) => ({
      id: li.id,
      name: li.name,
      sku: li.sku ?? 'N/A',
      quantity: li.quantity,
      price: parseFloat(li.price ?? '0'),
      total: parseFloat(li.total ?? '0'),
    })),
    created_at: raw.date_created,
    updated_at: raw.date_modified,
  };
}

export async function getOrder(client: ResilientHttpClient, orderId: number, maskPii = true): Promise<UnifiedOrder> {
  const res = await client.get<any>(`orders/${orderId}`);
  return normalizeWooOrder(res.data, maskPii);
}

export async function searchOrders(
  client: ResilientHttpClient,
  params: {
    query?: string; email?: string; status?: string; payment_status?: PaymentStatus;
    after?: string; before?: string; limit?: number; page?: number;
  },
  maskPii = true
): Promise<PaginatedResult<UnifiedOrder[]>> {
  const page = params.page ?? 1;
  const perPage = Math.min(params.limit ?? 10, 50);

  const res = await client.get<any[]>('orders', {
    page, per_page: perPage,
    search: params.query ?? params.email,
    status: params.status,
    after: params.after,
    before: params.before,
  });

  let orders = res.data.map((o) => normalizeWooOrder(o, maskPii));
  if (params.payment_status) {
    orders = orders.filter((o) => o.payment.status === params.payment_status);
  }

  return { data: orders, pagination: extractWooPagination(res.headers, page, perPage) };
}
