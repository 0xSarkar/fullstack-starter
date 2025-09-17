import Fastify from 'fastify';
import fp from 'fastify-plugin';
import App from '../../../src/app.js';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert';
import { startSuiteTransactionOnFastify } from '../../suite-transaction.js';

describe('Logout Route', { concurrency: 1 }, () => {
  let fastify: ReturnType<typeof Fastify>;
  const uniqueEmail = `test-logout-${Date.now()}@example.com`;
  const password = 'LogoutPass123!';
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

  it('should logout successfully and clear auth cookie', async () => {
    const res = await fastify.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: { authorization: `Bearer ${token}` }
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.success, true);

    // Ensure cookie cleared via Set-Cookie header
    const setCookie = res.headers['set-cookie'] || res.headers['Set-Cookie'];
    assert.ok(setCookie, 'expected set-cookie header to be present');
    // The cookie string should include authToken=; and Expires or Max-Age to indicate clearing
    const cookieStr = Array.isArray(setCookie) ? setCookie.join(';') : String(setCookie);
    assert.match(cookieStr, /authToken=;|authToken=; Expires|authToken=; Max-Age/);
  });
});
