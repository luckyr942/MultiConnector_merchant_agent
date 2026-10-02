// Simple logger helper writing to stderr so stdout remains clean for MCP JSON-RPC protocol.

export interface AuditMetric {
  provider: string;
  operation: string;
  durationMs: number;
  status: 'SUCCESS' | 'ERROR';
  statusCode?: number;
  error?: string;
}

export class Logger {
  static logAudit(metric: AuditMetric): void {
    const entry = { timestamp: new Date().toISOString(), ...metric };
    process.stderr.write(`[AUDIT] ${JSON.stringify(entry)}\n`);
  }

  static info(message: string): void {
    process.stderr.write(`[INFO]  ${new Date().toISOString()} ${message}\n`);
  }

  static warn(message: string): void {
    process.stderr.write(`[WARN]  ${new Date().toISOString()} ${message}\n`);
  }

  static error(message: string, err?: unknown): void {
    const detail = err instanceof Error ? err.message : String(err ?? '');
    process.stderr.write(`[ERROR] ${new Date().toISOString()} ${message} ${detail}\n`);
  }
}
