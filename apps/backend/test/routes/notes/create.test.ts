import Fastify from 'fastify';
import fp from 'fastify-plugin';
import App from '../../../src/app.js';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert';
import { startSuiteTransactionOnFastify } from '../../suite-transaction.js';

describe('Notes Create Route', { concurrency: 1 }, () => {
  let fastify: ReturnType<typeof Fastify>;
  const uniqueEmail = `test-notes-create-${Date.now()}@example.com`;
  const password = 'NotesPass123!';
  let authCookie: string | undefined;

  // helper-managed suite transaction
  let teardown!: () => Promise<void>;

  before(async () => {
    fastify = Fastify({ logger: false });
    await fastify.register(fp(App));

    // Start suite-level transaction
    ({ teardown } = await startSuiteTransactionOnFastify(fastify));

    const res = await fastify.inject({ method: 'POST', url: '/auth/signup', payload: { email: uniqueEmail, password } });
    assert.equal(res.statusCode, 201);
    authCookie = (res.headers['set-cookie'] || res.headers['Set-Cookie']) as string | undefined;
    assert.ok(authCookie);
  });

  after(async () => {
    await teardown(); // rollback transaction
    await fastify.close();
  });

  it('creates a note successfully (201)', async () => {
    const payload = { title: 'My Note', content: 'This is my first note' };
    const res = await fastify.inject({ method: 'POST', url: '/notes', payload, headers: { cookie: authCookie! } });
    assert.equal(res.statusCode, 201);
    const body = res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.id);
    assert.equal(body.data.title, payload.title);
    assert.equal(body.data.content, payload.content);
    assert.ok(body.data.createdAt);
  });

  it('creates a note with only title (201)', async () => {
    const payload = { title: 'Title Only Note' };
    const res = await fastify.inject({ method: 'POST', url: '/notes', payload, headers: { cookie: authCookie! } });
    assert.equal(res.statusCode, 201);
    const body = res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.title, payload.title);
    assert.equal(body.data.content, null);
  });

  it('creates a note with only content (201)', async () => {
    const payload = { content: 'Content only note' };
    const res = await fastify.inject({ method: 'POST', url: '/notes', payload, headers: { cookie: authCookie! } });
    assert.equal(res.statusCode, 201);
    const body = res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.title, null);
    assert.equal(body.data.content, payload.content);
  });

  it('creates an empty note (201)', async () => {
    const payload = {};
    const res = await fastify.inject({ method: 'POST', url: '/notes', payload, headers: { cookie: authCookie! } });
    assert.equal(res.statusCode, 201);
    const body = res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.title, null);
    assert.equal(body.data.content, null);
  });
});
