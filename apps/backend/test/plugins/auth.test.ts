import { describe, it, before, after } from 'node:test';
import * as assert from 'node:assert';
import Fastify from 'fastify';
import AuthPlugin from '../../src/plugins/auth.js';
import config from '../../src/plugins/config.js';
import jwt from '../../src/plugins/jwt.js';
import cookie from '../../src/plugins/cookie.js';

describe('auth plugin', () => {
  let fastify: ReturnType<typeof Fastify>;

  before(async () => {
    fastify = Fastify();
    // Register config, cookie, and jwt plugins as dependencies
    await fastify.register(config);
    await fastify.register(cookie);
    await fastify.register(jwt);
    // Register the auth plugin
    await fastify.register(AuthPlugin);

    // Dummy protected route
    fastify.get('/protected', { onRequest: fastify.authenticate }, async (req: any, reply: any) => {
      return { user: req.user };
    });
  });

  after(async () => {
    await fastify.close();
  });

  it('should succeed with valid token', async () => {
    const token = fastify.jwt.sign({ id: '1', email: 'test@example.com' });
    const res = await fastify.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: `Bearer ${token}` }
    });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(JSON.parse(res.body).user.id, '1');
  });

  it('should fail with no token', async () => {
    const res2 = await fastify.inject({ method: 'GET', url: '/protected' });
    assert.equal(res2.statusCode, 401);
    assert.match(res2.body, /Authentication required/);
  });

  it('should fail with invalid token', async () => {
    const res3 = await fastify.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: 'Bearer invalidtoken' }
    });
    assert.equal(res3.statusCode, 401);
  });
});
