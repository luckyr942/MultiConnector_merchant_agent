import { describe, it, expect } from 'vitest';
import { normalizeWooOrder } from '../src/providers/woocommerce/orders.js';
import { normalizeFreshdeskTicket } from '../src/providers/freshdesk/tickets.js';

const rawOrder = {
  id: 1001, number: '1001', status: 'completed', currency: 'INR',
  total: '2999', subtotal: '2999', total_tax: '0', shipping_total: '0',
  payment_method: 'razorpay_upi', payment_method_title: 'Razorpay UPI',
  transaction_id: 'pay_ABC123', date_paid: '2026-10-03T10:00:00Z',
  date_created: '2026-10-03T09:00:00Z', date_modified: '2026-10-03T10:00:00Z',
  billing: { first_name: 'Rahul', last_name: 'Sharma', email: 'rahul@example.com', phone: '+919876543210', city: 'Bengaluru' },
  shipping: {}, line_items: [{ id: 1, name: 'Headphones', product_id: 101, sku: 'H-01', quantity: 1, price: '2999', total: '2999' }]
};

describe('WooCommerce Order Normalizer', () => {
  it('correctly derives payment status as paid', () => {
    const order = normalizeWooOrder(rawOrder);
    expect(order.payment.status).toBe('paid');
    expect(order.provider).toBe('woocommerce');
  });

  it('masks customer PII by default', () => {
    const order = normalizeWooOrder(rawOrder, true);
    expect(order.customer.email).not.toBe('rahul@example.com');
    expect(order.customer.email).toContain('***');
    expect(order.customer.phone).toContain('***');
  });

  it('preserves PII when masking disabled', () => {
    const order = normalizeWooOrder(rawOrder, false);
    expect(order.customer.email).toBe('rahul@example.com');
  });

  it('correctly maps financials', () => {
    const order = normalizeWooOrder(rawOrder);
    expect(order.financials.total).toBe(2999);
    expect(order.financials.currency).toBe('INR');
  });
});

describe('Freshdesk Ticket Normalizer', () => {
  const rawTicket = {
    id: 101, subject: 'Payment issue', status: 2, priority: 4,
    requester: { name: 'Test User', email: 'test@example.com' },
    description_text: 'My payment failed.', tags: ['payment'],
    created_at: '2026-10-03T09:00:00Z', updated_at: '2026-10-03T09:30:00Z'
  };

  it('maps status and priority correctly', () => {
    const ticket = normalizeFreshdeskTicket(rawTicket);
    expect(ticket.status).toBe('open');
    expect(ticket.priority).toBe('urgent');
  });

  it('masks requester email by default', () => {
    const ticket = normalizeFreshdeskTicket(rawTicket, true);
    expect(ticket.requester.email).not.toBe('test@example.com');
  });
});
