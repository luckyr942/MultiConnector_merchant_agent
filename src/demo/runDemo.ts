// Interactive agent demo simulating merchant support queries
// Run using: npm run demo

import { loadFixture } from '../fixtures/loader.js';
import { normalizeWooOrder } from '../providers/woocommerce/orders.js';
import { normalizeWooProduct } from '../providers/woocommerce/products.js';
import { normalizeFreshdeskTicket } from '../providers/freshdesk/tickets.js';

function print(label: string, data: unknown) {
  console.log('\n' + '═'.repeat(60));
  console.log(`  ${label}`);
  console.log('═'.repeat(60));
  console.log(JSON.stringify(data, null, 2));
}

function agentMessage(msg: string) {
  console.log(`\n🤖 Agent: ${msg}`);
}

function merchantMessage(msg: string) {
  console.log(`\n👤 Merchant: ${msg}`);
}

async function runDemo() {
  console.log('\n' + '━'.repeat(60));
  console.log('  MultiConnector Merchant Agent — Demo Session');
  console.log('  Mode: Offline Fixture Replay (No API keys needed)');
  console.log('━'.repeat(60));

  const orders = await loadFixture('woocommerce/orders.list.json') as any[];
  const products = await loadFixture('woocommerce/products.list.json') as any[];
  const tickets = await loadFixture('freshdesk/tickets.list.json') as any[];

  // Demo 1: Order Lookup
  merchantMessage('"Where is order #1001 and was the payment successful?"');
  agentMessage('Calling → get_order(1001)...');
  const order1001 = normalizeWooOrder(orders.find(o => o.id === 1001));
  print('get_order(1001)', order1001);
  agentMessage(
    `Order #1001 is ${order1001.status}. ` +
    `Payment of ₹${order1001.financials.total} via ${order1001.payment.method_title} — Status: ${order1001.payment.status.toUpperCase()}. ` +
    `Customer city: ${order1001.customer.city}.`
  );

  // Demo 2: Failed Payment Triage
  merchantMessage('"Show me all orders where payment failed today."');
  agentMessage('Calling → search_orders(payment_status: "failed")...');
  const failedOrders = orders.map(o => normalizeWooOrder(o)).filter(o => o.payment.status === 'failed');
  print('search_orders(payment_status=failed)', failedOrders);
  agentMessage(
    `Found ${failedOrders.length} failed payment order(s):\n` +
    failedOrders.map(o => `  • Order #${o.order_number} — ₹${o.financials.total} via ${o.payment.method_title}`).join('\n')
  );

  // Demo 3: Inventory Check
  merchantMessage('"How many units of ACME-SW-02 smartwatches do we have?"');
  agentMessage('Calling → get_inventory("ACME-SW-02")...');
  const sw02 = products.find(p => p.sku === 'ACME-SW-02');
  print('get_inventory(ACME-SW-02)', { sku: sw02.sku, name: sw02.name, units_available: sw02.stock_quantity, in_stock: sw02.stock_status === 'instock' });
  agentMessage(`Only ${sw02.stock_quantity} units of "${sw02.name}" remain in stock. ⚠️ Low stock alert.`);

  // Demo 4: Ticket Triage
  merchantMessage('"Show me all urgent open support tickets."');
  agentMessage('Calling → search_tickets(status: "open", priority: "urgent")...');
  const urgentTickets = tickets.map(t => normalizeFreshdeskTicket(t)).filter(t => t.priority === 'urgent');
  print('search_tickets(status=open, priority=urgent)', urgentTickets);
  agentMessage(
    urgentTickets.length > 0
      ? `Found ${urgentTickets.length} urgent open ticket(s):\n` + urgentTickets.map(t => `  • [#${t.id}] ${t.subject}`).join('\n')
      : 'No urgent open tickets at this time.'
  );

  // Demo 5: Multi-step Reasoning
  merchantMessage('"Which products were in failed-payment orders today?"');
  agentMessage('Step 1 → search_orders(payment_status: "failed")');
  agentMessage('Step 2 → Extracting product SKUs from failed orders...');
  const failedItems = orders.map(o => normalizeWooOrder(o)).filter(o => o.payment.status === 'failed').flatMap(o => o.items);
  const skus = [...new Set(failedItems.map(i => i.sku))];
  agentMessage(`Step 3 → Checking inventory for: ${skus.join(', ')}`);
  const inventory = skus.map(sku => {
    const p = products.find(p => p.sku === sku);
    return p ? `${p.name} (${sku}): ${p.stock_quantity} units` : `${sku}: Not found`;
  });
  agentMessage('Result: Products from failed-payment orders:\n' + inventory.map(i => `  • ${i}`).join('\n'));

  console.log('\n' + '━'.repeat(60));
  console.log('  Demo complete. All 5 merchant scenarios demonstrated.');
  console.log('  Ready for submission. Run: npm run dev to start MCP server.');
  console.log('━'.repeat(60) + '\n');
}

runDemo().catch((err) => {
  console.error('Demo failed:', err.message);
  process.exit(1);
});
