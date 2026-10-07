import type { Theme } from '@debdaru07/schema';
import acmeJson from '@debdaru07/schema/fixtures/acme.json' with { type: 'json' };
import defaultJson from '@debdaru07/schema/fixtures/default.json' with { type: 'json' };
import globexJson from '@debdaru07/schema/fixtures/globex.json' with { type: 'json' };

export const acme = acmeJson as unknown as Theme;
export const globex = globexJson as unknown as Theme;
export const base = defaultJson as unknown as Theme;
export const FIXTURES = { default: base, acme, globex } as const;
