import type { ResilientHttpClient } from '../../core/http.js';
import type { UnifiedTicket, PaginatedResult, TicketStatus, TicketPriority } from '../../core/types.js';
import { maskEmail } from '../../core/redact.js';
import { buildOffsetPagination } from '../../core/pagination.js';

const STATUS_MAP: Record<number, TicketStatus> = { 2: 'open', 3: 'pending', 4: 'resolved', 5: 'closed' };
const PRIORITY_MAP: Record<number, TicketPriority> = { 1: 'low', 2: 'medium', 3: 'high', 4: 'urgent' };

export function normalizeFreshdeskTicket(raw: any, maskPii = true): UnifiedTicket {
  return {
    id: raw.id,
    subject: raw.subject ?? '(No subject)',
    status: STATUS_MAP[raw.status] ?? 'open',
    priority: PRIORITY_MAP[raw.priority] ?? 'medium',
    requester: {
      name: raw.requester?.name ?? 'Unknown',
      email: maskPii ? maskEmail(raw.requester?.email ?? raw.email) : (raw.requester?.email ?? raw.email ?? 'N/A'),
    },
    description: (raw.description_text ?? raw.description ?? '').replace(/<[^>]*>/g, '').trim().slice(0, 500),
    tags: raw.tags ?? [],
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    url: raw.id ? `https://${process.env.FRESHDESK_DOMAIN ?? 'yourdomain'}.freshdesk.com/a/tickets/${raw.id}` : undefined,
  };
}

export async function getTicket(client: ResilientHttpClient, ticketId: number, maskPii = true): Promise<UnifiedTicket> {
  const res = await client.get<any>(`tickets/${ticketId}`, { include: 'requester' });
  return normalizeFreshdeskTicket(res.data, maskPii);
}

export async function searchTickets(
  client: ResilientHttpClient,
  params: { query?: string; status?: TicketStatus; priority?: TicketPriority; page?: number; limit?: number },
  maskPii = true
): Promise<PaginatedResult<UnifiedTicket[]>> {
  const page = params.page ?? 1;
  const perPage = Math.min(params.limit ?? 10, 30);

  // Build Freshdesk search query string
  const parts: string[] = [];
  if (params.status) {
    const statusNum = Object.entries(STATUS_MAP).find(([, v]) => v === params.status)?.[0];
    if (statusNum) parts.push(`status:${statusNum}`);
  }
  if (params.priority) {
    const priorityNum = Object.entries(PRIORITY_MAP).find(([, v]) => v === params.priority)?.[0];
    if (priorityNum) parts.push(`priority:${priorityNum}`);
  }
  if (params.query) parts.push(`"${params.query}"`);

  let tickets: UnifiedTicket[] = [];
  let totalItems = 0;

  if (parts.length > 0) {
    // Use search API
    const q = parts.join(' AND ');
    const res = await client.get<any>('search/tickets', { query: `"${q}"`, page });
    tickets = (res.data?.results ?? []).map((t: any) => normalizeFreshdeskTicket(t, maskPii));
    totalItems = res.data?.total ?? tickets.length;
  } else {
    // List API
    const res = await client.get<any[]>('tickets', {
      page, per_page: perPage, include: 'requester', order_by: 'created_at', order_type: 'desc',
    });
    tickets = res.data.map((t) => normalizeFreshdeskTicket(t, maskPii));
    totalItems = tickets.length;
  }

  return { data: tickets, pagination: buildOffsetPagination(page, perPage, totalItems) };
}

export async function getTicketConversations(client: ResilientHttpClient, ticketId: number, maskPii = true) {
  const res = await client.get<any[]>(`tickets/${ticketId}/conversations`);
  return (res.data ?? []).map((c: any) => ({
    id: c.id,
    from_email: maskPii ? maskEmail(c.from_email) : c.from_email,
    body_text: (c.body_text ?? '').trim().slice(0, 500),
    incoming: c.incoming,
    created_at: c.created_at,
  }));
}
