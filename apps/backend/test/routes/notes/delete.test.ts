import Fastify from 'fastify';
import fp from 'fastify-plugin';
import App from '../../../src/app.js';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert';
import { startSuiteTransactionOnFastify } from '../../suite-transaction.js';

describe('Notes Delete Route', { concurrency: 1 }, () => {
  let fastify: ReturnType<typeof Fastify>;
  const uniqueEmail = `test-notes-delete-${Date.now()}@example.com`;
  const password = 'NotesPass123!';
  let authCookie: string | undefined;
  let createdId: string | undefined;

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

    // create a note to delete
    const payload = { title: 'Note to delete', content: 'This will be deleted' };
    const r = await fastify.inject({ method: 'POST', url: '/notes', payload, headers: { cookie: authCookie! } });
    assert.equal(r.statusCode, 201);
    createdId = r.json().data.id;
  });

  after(async () => {
    await teardown(); // rollback transaction
    await fastify.close();
  });

  it('deletes the note and returns 200', async () => {
    const res = await fastify.inject({ method: 'DELETE', url: `/notes/${createdId}`, headers: { cookie: authCookie! } });
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.success, true);

    // fetching afterwards should return 404
    const res2 = await fastify.inject({ method: 'GET', url: `/notes/${createdId}`, headers: { cookie: authCookie! } });
    assert.equal(res2.statusCode, 404);
  });

  it('returns 404 for non-existing note', async () => {
    const res = await fastify.inject({ method: 'DELETE', url: `/notes/00000000-0000-0000-0000-000000000000`, headers: { cookie: authCookie! } });
    assert.equal(res.statusCode, 404);
    const body = res.json();
    assert.equal(body.success, false);
    assert.equal(body.code, 'NOTE_NOT_FOUND');
  });
});
