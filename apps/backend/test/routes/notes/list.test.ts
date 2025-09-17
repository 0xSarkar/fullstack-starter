import Fastify from 'fastify';
import fp from 'fastify-plugin';
import App from '../../../src/app.js';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert';
import { startSuiteTransactionOnFastify } from '../../suite-transaction.js';

describe('Notes List Route', { concurrency: 1 }, () => {
  let fastify: ReturnType<typeof Fastify>;
  const uniqueEmail = `test-notes-list-${Date.now()}@example.com`;
  const password = 'ListPass123!';
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

  it('returns paginated list with correct shape and order', async () => {
    // create 5 notes
    const noteIds: string[] = [];
    for (let i = 0; i < 5; i++) {
      const payload = { title: `Note ${i}`, content: `Content ${i}` };
      const r = await fastify.inject({ method: 'POST', url: '/notes', payload, headers: { cookie: authCookie! } });
      assert.equal(r.statusCode, 201);
      noteIds.push(r.json().data.id);
    }

    // page 1, pageSize 2 -> should return most recent 2 notes
    const r1 = await fastify.inject({ method: 'GET', url: '/notes?page=1&pageSize=2', headers: { cookie: authCookie! } });
    assert.equal(r1.statusCode, 200);
    const b1 = r1.json();
    assert.equal(b1.success, true);
    assert.equal(Array.isArray(b1.data), true);
    assert.equal(b1.data.length, 2);
    // items should be ordered by updated_at desc (most recent first)
    assert.ok(new Date(b1.data[0].updatedAt) >= new Date(b1.data[1].updatedAt));
    assert.equal(b1.pagination.page, 1);
    assert.equal(b1.pagination.limit, 2);
    assert.equal(b1.pagination.total, 5);

    // page 3, pageSize 2 -> should return 1 item (5th)
    const r3 = await fastify.inject({ method: 'GET', url: '/notes?page=3&pageSize=2', headers: { cookie: authCookie! } });
    assert.equal(r3.statusCode, 200);
    const b3 = r3.json();
    assert.equal(b3.data.length, 1);

    // page beyond -> empty items
    const r4 = await fastify.inject({ method: 'GET', url: '/notes?page=10&pageSize=2', headers: { cookie: authCookie! } });
    assert.equal(r4.statusCode, 200);
    const b4 = r4.json();
    assert.equal(b4.data.length, 0);
  });

  it('returns empty list for new user', async () => {
    const otherEmail = `test-notes-list-empty-${Date.now()}@example.com`;
    const r = await fastify.inject({ method: 'POST', url: '/auth/signup', payload: { email: otherEmail, password } });
    assert.equal(r.statusCode, 201);
    const cookie = (r.headers['set-cookie'] || r.headers['Set-Cookie']) as string;

    const rl = await fastify.inject({ method: 'GET', url: '/notes', headers: { cookie } });
    assert.equal(rl.statusCode, 200);
    const bl = rl.json();
    assert.equal(bl.success, true);
    assert.equal(Array.isArray(bl.data), true);
    assert.equal(bl.data.length, 0);
  });
});
