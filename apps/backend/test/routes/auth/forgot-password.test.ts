import Fastify from 'fastify';
import fp from 'fastify-plugin';
import App from '../../../src/app.js';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert';
import { startSuiteTransactionOnFastify } from '../../suite-transaction.js';

describe('Forgot Password Route', { concurrency: 1 }, () => {
  let fastify: ReturnType<typeof Fastify>;
  const uniqueEmail = `test-forgot-${Date.now()}@example.com`;

  // helper-managed suite transaction
  let teardown!: () => Promise<void>;

  before(async () => {
    fastify = Fastify({ logger: false });
    await fastify.register(fp(App));

    // Start suite-level transaction
    ({ teardown } = await startSuiteTransactionOnFastify(fastify));

    // create a user to run forgot-password against
    await fastify.inject({ method: 'POST', url: '/auth/signup', payload: { email: uniqueEmail, password: 'InitialPass123' } });
  });

  after(async () => {
    await teardown(); // rollback transaction
    await fastify.close();
  });

  it('should respond 200 and store a token for existing user', async () => {
    const res = await fastify.inject({ method: 'POST', url: '/auth/forgot-password', payload: { email: uniqueEmail } });
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.success, true);

    // verify a token row exists for the user
    const user = await fastify.kysely.selectFrom('users').select(['id']).where('email', '=', uniqueEmail).executeTakeFirst();
    assert.ok(user && user.id);

    const tokenRow = await fastify.kysely.selectFrom('password_reset_tokens').selectAll().where('user_id', '=', user.id).orderBy('created_at', 'desc').executeTakeFirst();
    assert.ok(tokenRow, 'expected a password_reset_tokens row to be created');
    assert.ok(tokenRow.token_hash, 'expected token_hash to be present');
  });

  it('should return generic 200 for unknown email (prevent enumeration)', async () => {
    const res = await fastify.inject({ method: 'POST', url: '/auth/forgot-password', payload: { email: 'no-such-user@example.com' } });
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.success, true);
  });
});
