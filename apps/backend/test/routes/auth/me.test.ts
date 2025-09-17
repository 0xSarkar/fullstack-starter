import Fastify from 'fastify';
import fp from 'fastify-plugin';
import App from '../../../src/app.js';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert';
import { startSuiteTransactionOnFastify } from '../../suite-transaction.js';

describe('Me Route', { concurrency: 1 }, () => {
  let fastify: ReturnType<typeof Fastify>;
  const uniqueEmail = `test-me-${Date.now()}@example.com`;
  const password = 'MePass123!';
  let token: string;

  // helper-managed suite transaction
  let teardown!: () => Promise<void>;

  before(async () => {
    fastify = Fastify({ logger: false });
    await fastify.register(fp(App));

    // Start suite-level transaction
    ({ teardown } = await startSuiteTransactionOnFastify(fastify));

    // Create user and obtain token
    const signupRes = await fastify.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: { email: uniqueEmail, password }
    });

    const signupBody = signupRes.json();
    token = signupBody.data.token;
  });

  after(async () => {
    await teardown(); // rollback transaction
    await fastify.close();
  });

  it('should return user data when authenticated with Bearer token', async () => {
    const res = await fastify.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { authorization: `Bearer ${token}` }
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.user.email, uniqueEmail);
  });

  it('should require authentication (no token)', async () => {
    const res = await fastify.inject({ method: 'GET', url: '/auth/me' });
    assert.equal(res.statusCode, 401);
  });

  it('should return user data when authenticated via cookie', async () => {
    const res = await fastify.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { cookie: `authToken=${token}` }
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.user.email, uniqueEmail);
  });
});
