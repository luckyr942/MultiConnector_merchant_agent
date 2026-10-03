import { createAuthHeaders, type AuthStrategy } from './auth.js';
import { executeWithRetry } from './retry.js';
import { Logger } from './logger.js';

/**
 * Token Bucket Rate Limiter — client-side pacing to prevent 429s.
 */
export class TokenBucketRateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private readonly capacity: number = 20,
    private readonly refillRps: number = 10
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const elapsed = (Date.now() - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRps);
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refill();
    if (this.tokens >= 1) { this.tokens -= 1; return; }
    const waitMs = Math.max(10, ((1 - this.tokens) / this.refillRps) * 1000);
    await new Promise((r) => setTimeout(r, waitMs));
    return this.acquire();
  }
}

export interface HttpClientConfig {
  baseUrl: string;
  auth: AuthStrategy;
  rateLimitRps?: number;
  rateLimitBurst?: number;
  maxRetries?: number;
  timeoutMs?: number;
  providerName: string;
  extraHeaders?: Record<string, string>;
}

/**
 * Resilient HTTP Client
 * Used by every merchant provider adapter.
 */
export class ResilientHttpClient {
  private readonly baseUrl: string;
  private readonly authHeaders: Record<string, string>;
  private readonly extraHeaders: Record<string, string>;
  private readonly rateLimiter: TokenBucketRateLimiter;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;
  readonly providerName: string;

  constructor(config: HttpClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.authHeaders = createAuthHeaders(config.auth);
    this.extraHeaders = config.extraHeaders ?? {};
    this.rateLimiter = new TokenBucketRateLimiter(config.rateLimitBurst ?? 20, config.rateLimitRps ?? 10);
    this.maxRetries = config.maxRetries ?? 3;
    this.timeoutMs = config.timeoutMs ?? 8000;
    this.providerName = config.providerName;
  }

  async get<T>(
    endpoint: string,
    params: Record<string, string | number | boolean | undefined> = {}
  ): Promise<{ data: T; headers: Headers }> {
    await this.rateLimiter.acquire();
    const url = new URL(`${this.baseUrl}/${endpoint.replace(/^\//, '')}`);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '') url.searchParams.append(k, String(v));
    }

    const start = Date.now();
    try {
      const result = await executeWithRetry(
        () => fetch(url.toString(), {
          method: 'GET',
          headers: {
            ...this.authHeaders,
            ...this.extraHeaders,
            'Content-Type': 'application/json',
            'User-Agent': 'MultiConnector-MCP/1.0',
          },
          signal: AbortSignal.timeout(this.timeoutMs),
        }),
        async (res) => ({ data: (await res.json()) as T, headers: res.headers }),
        { maxRetries: this.maxRetries, provider: this.providerName }
      );
      Logger.logAudit({ provider: this.providerName, operation: endpoint, durationMs: Date.now() - start, status: 'SUCCESS' });
      return result;
    } catch (err: any) {
      Logger.logAudit({ provider: this.providerName, operation: endpoint, durationMs: Date.now() - start, status: 'ERROR', error: err.message });
      throw err;
    }
  }
}
