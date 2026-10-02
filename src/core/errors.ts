// Custom error handling for connector operations

export type ErrorCode = 'AUTH_ERROR' | 'RATE_LIMITED' | 'NOT_FOUND' | 'API_ERROR' | 'VALIDATION_ERROR' | 'TIMEOUT';

export class ConnectorError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly statusCode?: number,
    public readonly provider?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ConnectorError';
  }
}

export function throwFromHttpStatus(status: number, body: string, provider: string): never {
  let parsed: any = {};
  try {
    parsed = JSON.parse(body);
  } catch {
    parsed = { message: body };
  }
  const message = parsed.message || parsed.error || parsed.code || `HTTP ${status} from ${provider}`;

  if (status === 401 || status === 403) throw new ConnectorError(message, 'AUTH_ERROR', status, provider, parsed);
  if (status === 404) throw new ConnectorError(message, 'NOT_FOUND', status, provider, parsed);
  if (status === 429) throw new ConnectorError(message, 'RATE_LIMITED', status, provider, parsed);
  if (status === 408 || status === 504) throw new ConnectorError(message, 'TIMEOUT', status, provider, parsed);
  throw new ConnectorError(message, 'API_ERROR', status, provider, parsed);
}
