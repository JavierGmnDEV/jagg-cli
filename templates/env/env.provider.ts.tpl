import type { EnvPort } from '{{portImport}}';
import { ZodEnvAdapter } from '{{adapterImport}}';

export const env: EnvPort = new ZodEnvAdapter();
