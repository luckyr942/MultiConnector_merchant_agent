# Agent Capabilities

## Supported

- Search WooCommerce orders
- Get order details
- Search products
- Get product details
- Check inventory
- Read payment status

## Not supported

- Create orders
- Cancel orders
- Refund payments
- Modify inventory
- Modify customers
- Modify payment state

## Security

- API keys supplied through environment variables
- PII masking enabled by default
- Read-only tool surface
- No secrets committed

## Known limitations

- Payment-status filtering may require client-side filtering
- No webhook-based synchronization
- No persistent cache
- API-key authentication rather than OAuth
- Fixture mode is used for offline demonstration
