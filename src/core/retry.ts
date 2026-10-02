import { throwFromHttpStatus } from './errors.js';

export interface RetryOptions {
  maxRetries: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  provider?: string;
}

export async function executeWithRetry<T>(
  fn: () => Promise<Response>,
  parser: (res: Response) => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { maxRetries, baseDelayMs = 1000, maxDelayMs = 8000, provider = 'unknown' } = options;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const response = await fn();

      if (response.ok) return await parser(response);

      // Retryable: 429 Rate Limited or 503 Service Unavailable
      if (response.status === 429 || response.status === 503) {
        attempt++;
        if (attempt > maxRetries) {
          const text = await response.text();
          throwFromHttpStatus(response.status, text, provider);
        }
        const retryAfter = response.headers.get('Retry-After');
        let delayMs: number;
        if (retryAfter) {
          const seconds = parseInt(retryAfter, 10);
          delayMs = !isNaN(seconds) ? seconds * 1000 : baseDelayMs * Math.pow(2, attempt);
        } else {
          const jitter = Math.random() * 200;
          delayMs = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt) + jitter);
        }
        await sleep(delayMs);
        continue;
      }

      // Non-retryable error
      const errorText = await response.text();
      throwFromHttpStatus(response.status, errorText, provider);
    } catch (err: any) {
      if (err.name === 'ConnectorError') throw err;
      if (attempt >= maxRetries) throw err;
      attempt++;
      await sleep(baseDelayMs * Math.pow(2, attempt));
    }
  }
  throw new Error('Unexpected retry termination');
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
