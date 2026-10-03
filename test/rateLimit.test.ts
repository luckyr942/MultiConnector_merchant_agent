import { describe, it, expect } from 'vitest';
import { TokenBucketRateLimiter } from '../src/core/http.js';

describe('Token Bucket Rate Limiter', () => {
  it('allows immediate requests when tokens are available', async () => {
    const limiter = new TokenBucketRateLimiter(5, 5);
    const start = Date.now();
    await limiter.acquire();
    expect(Date.now() - start).toBeLessThan(50);
  });

  it('throttles requests when burst is exceeded', async () => {
    const limiter = new TokenBucketRateLimiter(2, 2);
    await limiter.acquire();
    await limiter.acquire();
    const start = Date.now();
    await limiter.acquire(); // 3rd must wait ~500ms
    expect(Date.now() - start).toBeGreaterThanOrEqual(400);
  });
});
