#!/usr/bin/env node
// Generates OpenAPI types and a typed client for openapi-fetch
// - Fetches schema from backend swagger at /docs/json
// - Writes schema to src/openapi.json
// - Runs openapi-typescript to generate src/schema.ts
// - Writes a thin openapi-fetch client wrapper at src/client.ts

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkgRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(pkgRoot, '../..');

const DEFAULT_BACKEND_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const SCHEMA_URL = `${DEFAULT_BACKEND_URL}/docs/json`;
const SRC_DIR = path.join(pkgRoot, 'src');
const SCHEMA_JSON_PATH = path.join(SRC_DIR, 'openapi.json');
const SCHEMA_TS_PATH = path.join(SRC_DIR, 'schema.ts');
const CLIENT_TS_PATH = path.join(SRC_DIR, 'client.ts');

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function waitForHttp(url, { attempts = 30, delayMs = 500 } = {}) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok || res.status === 404) return true; // server up
    } catch { }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

async function fetchSchema() {
  const res = await fetch(SCHEMA_URL, { headers: { accept: 'application/json' } });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch OpenAPI schema from ${SCHEMA_URL}: ${res.status} ${res.statusText}\n${text}`);
  }
  return res.json();
}

async function runOpenapiTypescript(inputPath, outputPath) {
  // Prefer pnpm dlx to run openapi-typescript in a workspace-friendly way
  const cmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const args = ['dlx', 'openapi-typescript', inputPath, '--output', outputPath, '--export-type', '--indent', '2'];
  await new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', cwd: pkgRoot, env: process.env });
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`openapi-typescript exited with code ${code}`))));
  });
}

async function writeClientWrapper() {
  const content = `// Auto-generated thin client wrapper. Do not edit manually.
import createClientOrig from 'openapi-fetch';
import type { paths } from './schema';

export type { paths } from './schema';

export type UnauthorizedHandler = () => void;

export type CreateClientOptions = {
  baseUrl?: string;
  /** default: true, include cookies for auth */
  includeCredentials?: boolean;
  /** request timeout in ms, default: 10000 */
  timeoutMs?: number;
  /** called when a response is 401 */
  onUnauthorized?: UnauthorizedHandler;
  /** default headers */
  headers?: HeadersInit;
};

export const createClient = (opts: CreateClientOptions = {}) => {
  const baseUrl = opts.baseUrl || (typeof window !== 'undefined' ? (window as any).VITE_API_BASE_URL || '' : '');
  const includeCredentials = opts.includeCredentials ?? true;
  const timeoutMs = opts.timeoutMs ?? 10000;
  const onUnauthorized = opts.onUnauthorized;
  const defaultHeaders = opts.headers;

  const fetchWithConfig: typeof fetch = async (input, init) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      // Conditionally set Content-Type only for methods that typically send a body
      const headers = { ...defaultHeaders, ...(init?.headers as any) };
      const method = init?.method?.toUpperCase();
      if (method && ['POST', 'PUT', 'PATCH'].includes(method) && init?.body != null) {
        headers['Content-Type'] = 'application/json';
      }

      const res = await fetch(input, {
        ...init,
        credentials: includeCredentials ? 'include' : init?.credentials,
        headers,
        signal: init?.signal ?? controller.signal,
      });
      if (res.status === 401 && onUnauthorized) {
        // fire async to not block consumer
        setTimeout(() => onUnauthorized(), 0);
      }
      return res;
    } finally {
      clearTimeout(id);
    }
  };

  const client = createClientOrig<paths>({ baseUrl, fetch: fetchWithConfig });
  return client;
};

export default createClient;
`;

  await fs.writeFile(CLIENT_TS_PATH, content, 'utf8');
}

async function maybeStartBackend() {
  // If backend responds, reuse. Otherwise attempt to start it temporarily.
  const up = await waitForHttp(`${DEFAULT_BACKEND_URL}/docs`);
  if (up) return { stop: async () => { } };

  console.log('[api-client] Backend not detected. Starting backend dev server to obtain schema...');
  const cmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const args = ['--filter', '@fullstack-starter/backend', 'dev'];
  const child = spawn(cmd, args, { cwd: repoRoot, env: process.env, stdio: 'inherit' });

  // Wait until /docs is up (UI route). Give it some time.
  const ok = await waitForHttp(`${DEFAULT_BACKEND_URL}/docs`, { attempts: 60, delayMs: 500 });
  if (!ok) {
    child.kill();
    throw new Error('Failed to start backend to retrieve OpenAPI schema.');
  }
  return { stop: async () => { try { child.kill(); } catch { } } };
}

async function main() {
  await ensureDir(SRC_DIR);

  // Ensure backend up or start temporarily
  const handle = await maybeStartBackend();
  try {
    console.log(`[api-client] Fetching OpenAPI schema from ${SCHEMA_URL}...`);
    const schema = await fetchSchema();
    await fs.writeFile(SCHEMA_JSON_PATH, JSON.stringify(schema, null, 2));
    console.log(`[api-client] Wrote schema to ${path.relative(pkgRoot, SCHEMA_JSON_PATH)}`);

    console.log('[api-client] Generating TypeScript types with openapi-typescript...');
    await runOpenapiTypescript(SCHEMA_JSON_PATH, SCHEMA_TS_PATH);
    console.log(`[api-client] Wrote types to ${path.relative(pkgRoot, SCHEMA_TS_PATH)}`);

    console.log('[api-client] Writing client wrapper...');
    await writeClientWrapper();
    console.log(`[api-client] Wrote client to ${path.relative(pkgRoot, CLIENT_TS_PATH)}`);
  } finally {
    await handle.stop();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
