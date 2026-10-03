import { describe, it, expect, vi } from 'vitest';
import { executeWithRetry } from '../src/core/retry.js';

describe('Retry with Exponential Backoff', () => {
  it('returns immediately on 200 success', async () => {
    const fn = vi.fn().mockResolvedValue(new Response('{"ok":true}', { status: 200 }));
    const result = await executeWithRetry(fn, (r) => r.json(), { maxRetries: 3, baseDelayMs: 10 });
    expect(result).toEqual({ ok: true });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on 429 and succeeds on 2nd attempt', async () => {
    const fn = vi.fn()
      .mockResolvedValueOnce(new Response('rate limited', { status: 429 }))
      .mockResolvedValueOnce(new Response('{"recovered":true}', { status: 200 }));
    const result = await executeWithRetry(fn, (r) => r.json(), { maxRetries: 3, baseDelayMs: 10 });
    expect(result).toEqual({ recovered: true });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws ConnectorError on 401 without retrying', async () => {
    const fn = vi.fn().mockResolvedValue(new Response('{"message":"Unauthorized"}', { status: 401 }));
    await expect(executeWithRetry(fn, (r) => r.json(), { maxRetries: 3, baseDelayMs: 10 })).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
