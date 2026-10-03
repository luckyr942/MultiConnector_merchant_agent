import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import * as Schemas from './schemas.js';
import { createWooClient } from '../providers/woocommerce/client.js';
import { searchOrders, getOrder } from '../providers/woocommerce/orders.js';
import { searchProducts, getProduct, getInventory } from '../providers/woocommerce/products.js';
import { createFreshdeskClient } from '../providers/freshdesk/client.js';
import { searchTickets, getTicket, getTicketConversations } from '../providers/freshdesk/tickets.js';
import { Logger } from '../core/logger.js';
import { loadFixture } from '../fixtures/loader.js';

const USE_MOCK = process.env.USE_MOCK_STORE === 'true';

const TOOLS = [
  {
    name: 'search_orders',
    description: 'Search WooCommerce orders by keyword, email, status, payment status (paid/failed/pending/refunded), or date range.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Free text search (order number, name)' },
        email: { type: 'string', description: 'Customer email' },
        status: { type: 'string', description: 'Order lifecycle status' },
        payment_status: { type: 'string', enum: ['paid','pending','failed','refunded','unknown'], description: 'Normalized payment status' },
        after: { type: 'string', description: 'ISO 8601 start date' },
        before: { type: 'string', description: 'ISO 8601 end date' },
        limit: { type: 'number', description: 'Max results (1-50)' },
        page: { type: 'number', description: 'Page number' },
      },
    },
  },
  {
    name: 'get_order',
    description: 'Get full normalized details of a WooCommerce order (items, payment method, masked customer info, totals).',
    inputSchema: { type: 'object', properties: { order_id: { type: 'number', description: 'Order ID' } }, required: ['order_id'] },
  },
  {
    name: 'search_products',
    description: 'Search WooCommerce product catalog by keyword or SKU.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' }, sku: { type: 'string' },
        limit: { type: 'number' }, page: { type: 'number' },
      },
    },
  },
  {
    name: 'get_product',
    description: 'Get pricing, stock, and metadata for a specific WooCommerce product.',
    inputSchema: { type: 'object', properties: { product_id: { type: 'number' } }, required: ['product_id'] },
  },
  {
    name: 'get_inventory',
    description: 'Check real-time stock availability by product SKU. Answers: "How many units of X are left?"',
    inputSchema: { type: 'object', properties: { sku: { type: 'string', description: 'Product SKU' } }, required: ['sku'] },
  },
  {
    name: 'search_tickets',
    description: 'Search Freshdesk support tickets by keyword, status (open/pending/resolved), or priority (low/medium/high/urgent).',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        status: { type: 'string', enum: ['open','pending','resolved','closed'] },
        priority: { type: 'string', enum: ['low','medium','high','urgent'] },
        limit: { type: 'number' }, page: { type: 'number' },
      },
    },
  },
  {
    name: 'get_ticket',
    description: 'Get full details of a Freshdesk support ticket.',
    inputSchema: { type: 'object', properties: { ticket_id: { type: 'number' } }, required: ['ticket_id'] },
  },
  {
    name: 'get_ticket_conversations',
    description: 'Read the conversation thread history for a Freshdesk ticket.',
    inputSchema: { type: 'object', properties: { ticket_id: { type: 'number' } }, required: ['ticket_id'] },
  },
];

export async function startMcpServer() {
  const wooClient = createWooClient();
  const freshdeskClient = createFreshdeskClient();

  const server = new Server(
    { name: 'multiconnector-merchant-agent', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    Logger.info(`Tool called: ${name}`);

    try {
      let result: unknown;

      if (USE_MOCK) {
        result = await handleWithMock(name, args ?? {});
      } else {
        result = await handleLive(name, args ?? {}, wooClient, freshdeskClient);
      }

      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    } catch (err: any) {
      Logger.error(`Tool ${name} failed`, err);
      return {
        isError: true,
        content: [{ type: 'text', text: `Error: ${err.message ?? String(err)}` }],
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  Logger.info(`MultiConnector MCP Server started. Mode: ${USE_MOCK ? 'MOCK' : 'LIVE'}`);
}

async function handleWithMock(name: string, args: any): Promise<unknown> {
  const wooOrders = await loadFixture('woocommerce/orders.list.json');
  const wooProducts = await loadFixture('woocommerce/products.list.json');
  const fdTickets = await loadFixture('freshdesk/tickets.list.json');
  const { normalizeWooOrder } = await import('../providers/woocommerce/orders.js');
  const { normalizeWooProduct } = await import('../providers/woocommerce/products.js');
  const { normalizeFreshdeskTicket } = await import('../providers/freshdesk/tickets.js');

  switch (name) {
    case 'search_orders': {
      const parsed = Schemas.SearchOrdersSchema.parse(args);
      let orders = (wooOrders as any[]).map((o) => normalizeWooOrder(o));
      if (parsed.payment_status) orders = orders.filter((o) => o.payment.status === parsed.payment_status);
      if (parsed.status) orders = orders.filter((o) => o.status === parsed.status);
      if (parsed.query) orders = orders.filter((o) => JSON.stringify(o).toLowerCase().includes(parsed.query!.toLowerCase()));
      return { data: orders, pagination: { page: 1, per_page: 10, total_items: orders.length, total_pages: 1 } };
    }
    case 'get_order': {
      const parsed = Schemas.GetOrderSchema.parse(args);
      const raw = (wooOrders as any[]).find((o) => o.id === parsed.order_id);
      if (!raw) throw new Error(`Order #${parsed.order_id} not found`);
      return normalizeWooOrder(raw);
    }
    case 'search_products': {
      const parsed = Schemas.SearchProductsSchema.parse(args);
      let products = (wooProducts as any[]).map(normalizeWooProduct);
      if (parsed.sku) products = products.filter((p) => p.sku.toLowerCase() === parsed.sku!.toLowerCase());
      if (parsed.query) products = products.filter((p) => p.name.toLowerCase().includes(parsed.query!.toLowerCase()));
      return { data: products, pagination: { page: 1, per_page: 10, total_items: products.length, total_pages: 1 } };
    }
    case 'get_product': {
      const parsed = Schemas.GetProductSchema.parse(args);
      const raw = (wooProducts as any[]).find((p) => p.id === parsed.product_id);
      if (!raw) throw new Error(`Product #${parsed.product_id} not found`);
      return normalizeWooProduct(raw);
    }
    case 'get_inventory': {
      const parsed = Schemas.GetInventorySchema.parse(args);
      const raw = (wooProducts as any[]).find((p) => p.sku.toLowerCase() === parsed.sku.toLowerCase());
      if (!raw) throw new Error(`SKU ${parsed.sku} not found`);
      return { sku: raw.sku, name: raw.name, stock_status: raw.stock_status, units_available: raw.stock_quantity, in_stock: raw.stock_status === 'instock' };
    }
    case 'search_tickets': {
      const parsed = Schemas.SearchTicketsSchema.parse(args);
      let tickets = (fdTickets as any[]).map((t) => normalizeFreshdeskTicket(t));
      if (parsed.status) tickets = tickets.filter((t) => t.status === parsed.status);
      if (parsed.priority) tickets = tickets.filter((t) => t.priority === parsed.priority);
      if (parsed.query) tickets = tickets.filter((t) => JSON.stringify(t).toLowerCase().includes(parsed.query!.toLowerCase()));
      return { data: tickets, pagination: { page: 1, per_page: 10, total_items: tickets.length, total_pages: 1 } };
    }
    case 'get_ticket': {
      const parsed = Schemas.GetTicketSchema.parse(args);
      const raw = (fdTickets as any[]).find((t) => t.id === parsed.ticket_id);
      if (!raw) throw new Error(`Ticket #${parsed.ticket_id} not found`);
      return normalizeFreshdeskTicket(raw);
    }
    case 'get_ticket_conversations':
      return { conversations: [], note: 'Conversation history available in live mode.' };
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function handleLive(name: string, args: any, wooClient: any, freshdeskClient: any): Promise<unknown> {
  switch (name) {
    case 'search_orders': return searchOrders(wooClient, Schemas.SearchOrdersSchema.parse(args));
    case 'get_order': { const p = Schemas.GetOrderSchema.parse(args); return getOrder(wooClient, p.order_id); }
    case 'search_products': return searchProducts(wooClient, Schemas.SearchProductsSchema.parse(args));
    case 'get_product': { const p = Schemas.GetProductSchema.parse(args); return getProduct(wooClient, p.product_id); }
    case 'get_inventory': { const p = Schemas.GetInventorySchema.parse(args); return getInventory(wooClient, p.sku); }
    case 'search_tickets': return searchTickets(freshdeskClient, Schemas.SearchTicketsSchema.parse(args));
    case 'get_ticket': { const p = Schemas.GetTicketSchema.parse(args); return getTicket(freshdeskClient, p.ticket_id); }
    case 'get_ticket_conversations': { const p = Schemas.GetConversationsSchema.parse(args); return getTicketConversations(freshdeskClient, p.ticket_id); }
    default: throw new Error(`Unknown tool: ${name}`);
  }
}
