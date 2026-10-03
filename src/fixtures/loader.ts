import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function loadFixture(relativePath: string): Promise<unknown> {
  const fullPath = join(__dirname, relativePath);
  const raw = await readFile(fullPath, 'utf-8');
  return JSON.parse(raw);
}
