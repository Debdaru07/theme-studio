import type { Theme } from '@dts/schema';
import acmeJson from '@dts/schema/fixtures/acme.json' with { type: 'json' };
import defaultJson from '@dts/schema/fixtures/default.json' with { type: 'json' };
import globexJson from '@dts/schema/fixtures/globex.json' with { type: 'json' };

export const acme = acmeJson as unknown as Theme;
export const globex = globexJson as unknown as Theme;
export const base = defaultJson as unknown as Theme;
export const FIXTURES = { default: base, acme, globex } as const;
