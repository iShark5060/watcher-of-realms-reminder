import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import dotenvx from '@dotenvx/dotenvx';

const { config: loadEnv } = dotenvx;

const defaultFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
const envPath = resolve(process.cwd(), defaultFile);

if (existsSync(envPath)) {
  loadEnv({ path: envPath, quiet: true });
}
