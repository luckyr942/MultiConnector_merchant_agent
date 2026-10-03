import 'dotenv/config';
import { startMcpServer } from './mcp/server.js';
import { Logger } from './core/logger.js';

Logger.info('Starting MultiConnector Merchant Agent...');
Logger.info(`Providers: WooCommerce | Freshdesk | Zoho | Unicommerce`);

startMcpServer().catch((err) => {
  Logger.error('Fatal startup error', err);
  process.exit(1);
});
