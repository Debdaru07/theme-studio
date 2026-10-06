/**
 * Deploy URLs for the docs site. The single place these live.
 * Read from the environment at build time (PUBLIC_* so Astro exposes them), with production defaults.
 */
type Env = Record<string, string | undefined>;

const viteEnv: Env = ((import.meta as unknown as { env?: Env }).env ?? {}) as Env;
const nodeEnv: Env = typeof process !== 'undefined' && process.env ? (process.env as Env) : {};

const pick = (key: string, fallback: string): string =>
  (viteEnv[key] || nodeEnv[key] || fallback).replace(/\/+$/, '');

/** Theme API origin (serves `GET /v1/theme`). */
export const API_URL = pick('PUBLIC_API_URL', 'https://theme-studio-api.onrender.com');
/** Theme Studio admin app. */
export const ADMIN_URL = pick('PUBLIC_ADMIN_URL', 'https://theme-studio.debdarudasgupta0799.workers.dev');
/** Source repository. */
export const REPO_URL = pick('PUBLIC_REPO_URL', 'https://github.com/Debdaru07/theme-studio');
