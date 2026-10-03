# 🛒 MultiConnector Merchant Agent

<p align="center">
  <b>Production-Grade MCP Connector Framework for E-Commerce & Customer Support AI Agents</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.7-blue.svg?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MCP%20Protocol-1.6.1-purple.svg?style=flat-square" alt="MCP Protocol" />
  <img src="https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg?style=flat-square&logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/Tests-14%20Passed-brightgreen.svg?style=flat-square&logo=vitest" alt="Vitest" />
  <img src="https://img.shields.io/badge/License-MIT-orange.svg?style=flat-square" alt="License" />
</p>

---

`MultiConnector Merchant Agent` is a unified **Model Context Protocol (MCP)** server that empowers AI agents to seamlessly query orders, inventory, and support tickets across multiple merchant platforms—including **WooCommerce**, **Freshdesk**, **Zoho Inventory**, and **Unicommerce**.

Designed specifically to integrate with customer support agents like [`cutomer_agent_`](https://github.com/luckyr942/cutomer_agent_).

---

## 📑 Table of Contents

- [Architecture](#-architecture)
- [Key Features](#-key-features)
- [Supported Platform Integrations](#-supported-platform-integrations)
- [Integration with Support Agent (`cutomer_agent_`)](#-integration-with-support-agent-cutomer_agent_)
- [MCP Tools Reference](#-mcp-tools-reference)
- [Getting Started](#-getting-started)
- [Interactive Demo](#-interactive-demo)
- [Testing](#-testing)
- [Directory Structure](#-directory-structure)
- [License](#-license)

---

## 🏗️ Architecture

```
                       ┌─────────────────────────────────────────┐
                       │   Customer Support Agent (cutomer_agent_)│
                       └────────────────────┬────────────────────┘
                                            │ MCP / Standard JSON-RPC
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          MultiConnector Merchant Agent (MCP)                           │
│                                                                                        │
│   ┌─────────────────────┐   ┌─────────────────────┐   ┌───────────────────────────┐   │
│   │ PII Masking Engine  │   │  Token Bucket Rate  │   │ Exponential Retry Backoff │   │
│   │ (Email/Phone/Addr)  │   │       Limiter       │   │       (with Jitter)       │   │
│   └──────────┬──────────┘   └──────────┬──────────┘   └─────────────┬─────────────┘   │
│              └─────────────────────────┼────────────────────────────┘                 │
│                                        ▼                                               │
│                        Unified Data Schema Normalizer                                  │
│             (UnifiedOrder | UnifiedProduct | UnifiedTicket | Stock)                    │
└────────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │
       ┌──────────────────┬──────────────┴───────┬──────────────────┐
       ▼                  ▼                      ▼                  ▼
┌──────────────┐   ┌──────────────┐       ┌──────────────┐   ┌──────────────┐
│ WooCommerce  │   │  Freshdesk   │       │     Zoho     │   │ Unicommerce  │
│  (Orders &   │   │  (Support    │       │  Inventory   │   │   (Orders)   │
│   Catalog)   │   │   Tickets)   │       │  (Stock/SKU) │   │              │
└──────────────┘   └──────────────┘       └──────────────┘   └──────────────┘
```

---

## ✨ Key Features

- 🔄 **Unified E-Commerce Schema**: Standardizes disparate API formats from WooCommerce, Zoho, and Unicommerce into clean, predictable TypeScript interfaces (`UnifiedOrder`, `UnifiedProduct`, `UnifiedTicket`).
- 🛡️ **Zero-Trust PII Protection**: Automatically redacts sensitive customer data (emails, phone numbers, addresses) before context is passed to the LLM.
- ⚡ **Production Resilience**:
  - **Token-Bucket Rate Limiter**: Throttles outbound API requests to avoid hitting merchant rate limits.
  - **Exponential Backoff with Jitter**: Automatically retries transient 429 and 503 errors.
  - **Clean Stderr Logging**: Isolates debug/audit telemetry on stderr to maintain JSON-RPC protocol integrity on stdout.
- 🔌 **Standard MCP Protocol**: Exposes 8 standard MCP tools for out-of-the-box compatibility with Cursor, Claude Desktop, LangChain, or custom agent setups.
- 🎭 **Offline Mock Replay**: Complete JSON fixture suite lets developers test agent flows without needing active API keys.

---

## 🔌 Supported Platform Integrations

| Provider | Data Domain | Capabilities |
|---|---|---|
| **WooCommerce** | E-Commerce | Order search, payment status, customer details, product catalog |
| **Freshdesk** | Helpdesk / Support | Ticket search, status/priority filtering, conversation history |
| **Zoho Inventory** | Stock & Warehouse | Real-time stock levels, SKU lookup |
| **Unicommerce** | Multichannel Orders | Order fulfillment tracking, normalized order items |

---

## 🤖 Integration with Support Agent (`cutomer_agent_`)

`MultiConnector Merchant Agent` acts as the data backend for AI customer support agents like [`cutomer_agent_`](https://github.com/luckyr942/cutomer_agent_).

### 1. Connecting via Model Context Protocol (MCP)
Add `MultiConnector Merchant Agent` to your agent server configuration:
```json
{
  "mcpServers": {
    "merchant-agent": {
      "command": "node",
      "args": ["/path/to/MultiConnector_merchant_agent/dist/index.js"],
      "env": {
        "MCP_MODE": "LIVE",
        "WOOCOMMERCE_URL": "https://your-store.com",
        "WOOCOMMERCE_CONSUMER_KEY": "ck_xxx",
        "WOOCOMMERCE_CONSUMER_SECRET": "cs_xxx"
      }
    }
  }
}
```

### 2. Direct Node Module Integration
```typescript
import { getOrder, getInventory, searchTickets } from 'multiconnector-merchant-agent';

// Inside your cutomer_agent_ tool handler:
async function handleCustomerInquiry(orderId: number) {
  const order = await getOrder(wooClient, orderId);

  // Email & Phone are automatically masked:
  console.log(order.customer.email); // -> "r**********a@example.com"
  return order;
}
```

---

## 🛠️ MCP Tools Reference

| Tool Name | Key Parameters | Description |
|---|---|---|
| `search_orders` | `status`, `payment_status`, `query` | Search merchant orders across WooCommerce and Unicommerce |
| `get_order` | `order_id` *(required)* | Get normalized details for a specific order |
| `search_products` | `query`, `sku`, `limit`, `page` | Search store catalog by title or SKU |
| `get_product` | `product_id` *(required)* | Get stock, pricing, and category metadata for a product |
| `get_inventory` | `sku` *(required)* | Check real-time stock availability for a SKU |
| `search_tickets` | `query`, `status`, `priority` | Search support tickets in Freshdesk |
| `get_ticket` | `ticket_id` *(required)* | Get details for a support ticket |
| `get_ticket_conversations` | `ticket_id` *(required)* | Get conversation thread history for a ticket |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `>= 18.0.0`
- **npm**: `>= 9.0.0`

### 1. Installation
```bash
git clone https://github.com/luckyr942/MultiConnector_merchant_agent.git
cd MultiConnector_merchant_agent
npm install
```

### 2. Environment Setup
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```
Fill in your credentials:
```env
# MOCK (for offline fixture demo) or LIVE (for real API calls)
MCP_MODE=MOCK

# WooCommerce Credentials
WOOCOMMERCE_URL=https://your-store.com
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxx

# Freshdesk Credentials
FRESHDESK_DOMAIN=yourdomain.freshdesk.com
FRESHDESK_API_KEY=your_freshdesk_api_key
```

### 3. Build & Run MCP Server
```bash
# Build TypeScript
npm run build

# Start MCP Server in production mode
npm start

# Or run dev mode with tsx
npm run dev
```

---

## 🎭 Interactive Demo

The project includes an interactive CLI demo that runs 5 merchant scenarios offline using JSON fixtures:

```bash
npm run demo
```

**Demonstrated Scenarios**:
1. 📦 **Order Lookup**: Retrieve order details & payment status.
2. ⚠️ **Failed Payment Triage**: Find orders where payment failed today.
3. 📉 **Inventory Check**: Low-stock alert trigger for product SKUs.
4. 🚨 **Urgent Ticket Triage**: List open high-priority customer tickets.
5. 🔍 **Multi-Step Agent Reasoning**: Cross-reference products from failed-payment orders with inventory stock levels.

---

## 🧪 Testing

Run the full unit test suite with Vitest:

```bash
npm test
```

Includes unit tests for:
- ✅ **PII Redaction**: Email, phone, address masking
- ✅ **Rate Limiting**: Token-bucket burst throttling
- ✅ **Retry Backoff**: Exponential delay calculation
- ✅ **Normalizers**: Raw API response conversion to unified domain types

---

## 📁 Directory Structure

```
MultiConnector_merchant_agent/
├── src/
│   ├── core/                  # Engine core
│   │   ├── auth.ts            # Authentication strategy handler
│   │   ├── errors.ts          # Error taxonomy & status code mapper
│   │   ├── http.ts            # Resilient HTTP client & rate limiter
│   │   ├── logger.ts          # Audit logger writing to stderr
│   │   ├── pagination.ts      # Pagination parsing helpers
│   │   ├── redact.ts          # PII masking utilities
│   │   ├── retry.ts           # Exponential retry logic
│   │   └── types.ts           # Canonical TypeScript interfaces
│   ├── providers/             # Platform integrations
│   │   ├── freshdesk/         # Freshdesk tickets client & normalizer
│   │   ├── unicommerce/       # Unicommerce orders adapter
│   │   ├── woocommerce/       # WooCommerce orders & catalog adapters
│   │   └── zoho/              # Zoho inventory adapter
│   ├── mcp/                   # MCP server implementation
│   │   ├── schemas.ts         # Zod schemas for tool inputs
│   │   └── server.ts          # Stdio MCP server protocol handler
│   ├── fixtures/              # Offline JSON test fixtures
│   ├── demo/                  # Interactive agent CLI demo
│   └── index.ts               # Main entry point
├── test/                      # Vitest test suite
├── package.json
└── tsconfig.json
```

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for details.

---

<p align="center">
  Built with ❤️ for E-Commerce & Customer Support AI Agents.
</p>
