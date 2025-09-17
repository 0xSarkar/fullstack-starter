import Fastify from 'fastify';
import fp from 'fastify-plugin';
import App from '../../../src/app.js';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert';
import { startSuiteTransactionOnFastify } from '../../suite-transaction.js';

describe('Notes Access Control', { concurrency: 1 }, () => {
  let fastify: ReturnType<typeof Fastify>;
  const emailA = `userA-notes-${Date.now()}@example.com`;
  const emailB = `userB-notes-${Date.now()}@example.com`;
  const password = 'Pass123!';
  let cookieA: string; let cookieB: string;
  let noteIdA: string;

  // helper-managed suite transaction
  let teardown!: () => Promise<void>;

  before(async () => {
    fastify = Fastify({ logger: false });
    await fastify.register(fp(App));

    // Start suite-level transaction
    ({ teardown } = await startSuiteTransactionOnFastify(fastify));

    const rA = await fastify.inject({ method: 'POST', url: '/auth/signup', payload: { email: emailA, password } });
    assert.equal(rA.statusCode, 201);
    cookieA = (rA.headers['set-cookie'] || rA.headers['Set-Cookie']) as string;

    const rB = await fastify.inject({ method: 'POST', url: '/auth/signup', payload: { email: emailB, password } });
    assert.equal(rB.statusCode, 201);
    cookieB = (rB.headers['set-cookie'] || rB.headers['Set-Cookie']) as string;

    // create note as A
    const payload = { title: 'Private to A', content: 'This is private' };
    const cr = await fastify.inject({ method: 'POST', url: '/notes', payload, headers: { cookie: cookieA } });
    assert.equal(cr.statusCode, 201);
    noteIdA = cr.json().data.id;
  });

  after(async () => {
    await teardown(); // rollback transaction
    await fastify.close();
  });

  it('B cannot GET A\'s note (404)', async () => {
    const res = await fastify.inject({ method: 'GET', url: `/notes/${noteIdA}`, headers: { cookie: cookieB } });
    assert.equal(res.statusCode, 404);
    const body = res.json();
    assert.equal(body.success, false);
    assert.equal(body.code, 'NOTE_NOT_FOUND');
  });

  it('B cannot PATCH A\'s note (404)', async () => {
    const res = await fastify.inject({ method: 'PATCH', url: `/notes/${noteIdA}`, payload: { title: 'Hacked' }, headers: { cookie: cookieB } });
    assert.equal(res.statusCode, 404);
    const body = res.json();
    assert.equal(body.success, false);
    assert.equal(body.code, 'NOTE_NOT_FOUND');
  });

  it('B cannot DELETE A\'s note (404)', async () => {
    const res = await fastify.inject({ method: 'DELETE', url: `/notes/${noteIdA}`, headers: { cookie: cookieB } });
    assert.equal(res.statusCode, 404);
    const body = res.json();
    assert.equal(body.success, false);
    assert.equal(body.code, 'NOTE_NOT_FOUND');
  });

  it('Different users can create notes with same content', async () => {
    const payload = { title: 'Same title', content: 'Same content' };
    const rA = await fastify.inject({ method: 'POST', url: '/notes', payload, headers: { cookie: cookieA } });
    assert.equal(rA.statusCode, 201);

    const rB = await fastify.inject({ method: 'POST', url: '/notes', payload, headers: { cookie: cookieB } });
    assert.equal(rB.statusCode, 201);
  });

  it('B list should not include A\'s note', async () => {
    const res = await fastify.inject({ method: 'GET', url: '/notes', headers: { cookie: cookieB } });
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.success, true);
    // B should only see their own notes, not A's
    const hasANote = body.data.some((note: any) => note.id === noteIdA);
    assert.equal(hasANote, false);
  });
});
