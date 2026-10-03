import { z } from 'zod';

const orderStatusEnum = z.enum(['pending','processing','on-hold','completed','cancelled','refunded','failed']).optional();
const paymentStatusEnum = z.enum(['paid','pending','failed','refunded','unknown']).optional();
const ticketStatusEnum = z.enum(['open','pending','resolved','closed']).optional();
const ticketPriorityEnum = z.enum(['low','medium','high','urgent']).optional();

export const SearchOrdersSchema = z.object({
  query: z.string().optional().describe('Free text search (order number, customer name)'),
  email: z.string().optional().describe('Customer email'),
  status: orderStatusEnum.describe('WooCommerce order status'),
  payment_status: paymentStatusEnum.describe('Normalized payment status (e.g. failed)'),
  after: z.string().optional().describe('ISO 8601 start date'),
  before: z.string().optional().describe('ISO 8601 end date'),
  limit: z.number().int().min(1).max(50).default(10),
  page: z.number().int().min(1).default(1),
});

export const GetOrderSchema = z.object({
  order_id: z.number().int().positive().describe('WooCommerce Order ID'),
});

export const SearchProductsSchema = z.object({
  query: z.string().optional().describe('Product name or keyword'),
  sku: z.string().optional().describe('Exact product SKU'),
  limit: z.number().int().min(1).max(50).default(10),
  page: z.number().int().min(1).default(1),
});

export const GetProductSchema = z.object({
  product_id: z.number().int().positive().describe('Product ID'),
});

export const GetInventorySchema = z.object({
  sku: z.string().min(1).describe('Product SKU to check stock for'),
});

export const SearchTicketsSchema = z.object({
  query: z.string().optional().describe('Search keyword in subject or description'),
  status: ticketStatusEnum.describe('Ticket status filter'),
  priority: ticketPriorityEnum.describe('Ticket priority filter'),
  limit: z.number().int().min(1).max(30).default(10),
  page: z.number().int().min(1).default(1),
});

export const GetTicketSchema = z.object({
  ticket_id: z.number().int().positive().describe('Freshdesk Ticket ID'),
});

export const GetConversationsSchema = z.object({
  ticket_id: z.number().int().positive().describe('Ticket ID to fetch conversations for'),
});
