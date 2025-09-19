#!/usr/bin/env node
// Generates OpenAPI json and schema
// - Fetches schema from backend swagger at /docs/json
// - Writes schema to src/openapi.json
// - Runs openapi-typescript to generate src/schema.ts

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
  } finally {
    await handle.stop();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
