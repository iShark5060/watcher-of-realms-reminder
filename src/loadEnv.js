import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { config as loadEnv } from '@dotenvx/dotenvx';

const defaultFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
const envPath = resolve(process.cwd(), defaultFile);

if (existsSync(envPath)) {
  loadEnv({ path: envPath, quiet: true });
}
