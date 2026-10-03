# MultiConnector Merchant Agent

A unified MCP connector for querying orders, inventory, and support tickets across **WooCommerce**, **Freshdesk**, **Zoho Inventory**, and **Unicommerce**.

Designed to work cleanly with customer support agents like [`cutomer_agent_`](https://github.com/luckyr942/cutomer_agent_).

---

## Features

- **Unified Schema**: Normalizes raw platform responses into standard order, product, inventory, and support ticket objects.
- **PII Masking**: Redacts customer emails, phone numbers, and addresses before returning data.
- **Rate Limiting & Retries**: Built-in token bucket rate limiting and exponential retry backoff for API requests.
- **MCP Server**: Provides 8 standard MCP tools compatible with Cursor, Claude Desktop, or custom agent setups.
- **Mock & Live Modes**: Test offline using JSON fixtures without requiring live API keys.

---

## Quick Start

### 1. Installation
```bash
git clone https://github.com/luckyr942/MultiConnector_merchant_agent.git
cd MultiConnector_merchant_agent
npm install
```

### 2. Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Set environment variables:
```env
MCP_MODE=MOCK

# WooCommerce Settings
WOOCOMMERCE_URL=https://your-store.com
WOOCOMMERCE_CONSUMER_KEY=ck_xxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxx

# Freshdesk Settings
FRESHDESK_DOMAIN=yourdomain.freshdesk.com
FRESHDESK_API_KEY=your_key
```

### 3. Run Demo
```bash
npm run demo
```

### 4. Run Tests
```bash
npm test
```

### 5. Start MCP Server
```bash
npm run dev
```

---

## Available Tools

| Tool Name | Arguments | Description |
|---|---|---|
| `search_orders` | `status`, `payment_status`, `query` | Search orders across merchant platforms |
| `get_order` | `order_id` | Fetch details for a specific order |
| `search_products` | `query`, `sku` | Search store catalog by title or SKU |
| `get_product` | `product_id` | Fetch price and stock details for a product |
| `get_inventory` | `sku` | Check stock availability for a SKU |
| `search_tickets` | `query`, `status`, `priority` | Search Freshdesk support tickets |
| `get_ticket` | `ticket_id` | Fetch details for a support ticket |
| `get_ticket_conversations` | `ticket_id` | Get discussion thread history for a ticket |

---

## Integration with Support Agent (`cutomer_agent_`)

Add to your MCP server configuration:
```json
{
  "mcpServers": {
    "merchant-agent": {
      "command": "node",
      "args": ["/path/to/MultiConnector_merchant_agent/dist/index.js"]
    }
  }
}
```

---

## License

MIT
