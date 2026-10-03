import { ResilientHttpClient } from '../../core/http.js';
import type { HttpClientConfig } from '../../core/http.js';

export function createWooClient(overrides?: Partial<HttpClientConfig>): ResilientHttpClient {
  const url = process.env.WOOCOMMERCE_URL ?? 'http://localhost:8080';
  const key = process.env.WOOCOMMERCE_CONSUMER_KEY ?? 'ck_test';
  const secret = process.env.WOOCOMMERCE_CONSUMER_SECRET ?? 'cs_test';
  return new ResilientHttpClient({
    baseUrl: `${url}/wp-json/wc/v3`,
    auth: { type: 'basic', username: key, password: secret },
    providerName: 'woocommerce',
    ...overrides,
  });
}
