import { ResilientHttpClient } from '../../core/http.js';

export function createFreshdeskClient(): ResilientHttpClient {
  const domain = process.env.FRESHDESK_DOMAIN ?? 'yourdomain';
  const apiKey = process.env.FRESHDESK_API_KEY ?? 'test_key';
  return new ResilientHttpClient({
    baseUrl: `https://${domain}.freshdesk.com/api/v2`,
    auth: { type: 'basic', username: apiKey, password: 'X' },
    providerName: 'freshdesk',
    rateLimitRps: 5, // Freshdesk free tier is rate-limited
  });
}
