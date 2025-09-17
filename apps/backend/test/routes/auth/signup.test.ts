import Fastify from 'fastify';
import fp from 'fastify-plugin';
import App from '../../../src/app.js';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert';
import { startSuiteTransactionOnFastify } from '../../suite-transaction.js';

describe('Signup Route', { concurrency: 1 }, () => {
  let fastify: ReturnType<typeof Fastify>;
  const uniqueEmail = `test-signup-${Date.now()}@example.com`;
  const password = 'SignupPass123!';

  // helper-managed suite transaction
  let teardown!: () => Promise<void>;

  before(async () => {
    fastify = Fastify({ logger: false });
    await fastify.register(fp(App));

    // Start suite-level transaction
    ({ teardown } = await startSuiteTransactionOnFastify(fastify));
  });

  after(async () => {
    await teardown(); // rollback transaction
    await fastify.close();
  });

  it('should create a new user, return token and set cookie', async () => {
    const res = await fastify.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: { email: uniqueEmail, password }
    });

    assert.equal(res.statusCode, 201);
    const body = res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.user.id);
    assert.equal(body.data.user.email, uniqueEmail);
    assert.ok(body.data.token);

    const setCookie = res.headers['set-cookie'] || res.headers['Set-Cookie'];
    assert.ok(setCookie, 'expected set-cookie header to be present');
  });

  it('should return 409 when user already exists', async () => {
    // First ensure user exists (signup already ran in previous test, but ensure idempotency)
    await fastify.inject({ method: 'POST', url: '/auth/signup', payload: { email: uniqueEmail, password } });
    // Either created (201) or conflict (409) - now call again to assert 409
    const res2 = await fastify.inject({ method: 'POST', url: '/auth/signup', payload: { email: uniqueEmail, password } });
    assert.equal(res2.statusCode, 409);
    const body = res2.json();
    assert.equal(body.success, false);
    assert.equal(body.code, 'USER_EXISTS');
    assert.ok(body.error.includes('User already exists'));
  });

  it('should return 400 for invalid request body', async () => {
    const res = await fastify.inject({ method: 'POST', url: '/auth/signup', payload: { email: 'not-an-email', password: '123' } });
    assert.equal(res.statusCode, 400);
    const body = res.json();
    assert.equal(body.success, false);
    assert.equal(body.code, 'VALIDATION_ERROR');
    assert.ok(body.details && body.details.errors);
    assert.ok(Array.isArray(body.details.errors));
  });
});
