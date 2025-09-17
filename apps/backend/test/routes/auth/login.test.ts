import Fastify from 'fastify';
import fp from 'fastify-plugin';
import App from '../../../src/app.js';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert';
import { startSuiteTransactionOnFastify } from '../../suite-transaction.js';

describe('Login Route', { concurrency: 1 }, () => {
  let fastify: ReturnType<typeof Fastify>;
  const uniqueEmail = `test-login-${Date.now()}@example.com`;
  const password = 'TestPass123!';

  // helper-managed suite transaction
  let teardown!: () => Promise<void>;

  before(async () => {
    fastify = Fastify({ logger: false });
    await fastify.register(fp(App));

    // Start suite-level transaction
    ({ teardown } = await startSuiteTransactionOnFastify(fastify));

    // Create a user via the signup route
    const signupRes = await fastify.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: { email: uniqueEmail, password }
    });

    if (signupRes.statusCode !== 201) {
      console.error('Failed to create user for login tests:', signupRes.body);
    }
  });

  after(async () => {
    await teardown(); // rollback transaction
    await fastify.close();
  });

  it('should login successfully with correct credentials and set auth cookie', async () => {
    const res = await fastify.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: uniqueEmail, password }
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.success, true);
    // response should include a token in data
    assert.ok(body.data.token);
    // should set auth cookie
    const setCookie = res.headers['set-cookie'] || res.headers['Set-Cookie'];
    assert.ok(setCookie, 'expected set-cookie header to be present');
  });

  it('should reject login with incorrect password', async () => {
    const res = await fastify.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: uniqueEmail, password: 'wrongPassword' }
    });

    assert.equal(res.statusCode, 401);
    const body = res.json();
    assert.equal(body.success, false);
    assert.equal(body.code, 'INVALID_CREDENTIALS');
    assert.ok(body.error && /Invalid credentials/.test(body.error));
  });

  it('should return 400 for invalid request body', async () => {
    const res = await fastify.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'not-an-email', password: '' }
    });

    assert.equal(res.statusCode, 400);
    const body = res.json();
    assert.equal(body.success, false);
    assert.equal(body.code, 'VALIDATION_ERROR');
  });
});
