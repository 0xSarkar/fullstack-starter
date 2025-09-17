import { describe, it, before, after } from 'node:test';
import * as assert from 'node:assert';
import Fastify from 'fastify';

import config from '../../src/plugins/config.js';
import cookie from '../../src/plugins/cookie.js';
import jwt from '../../src/plugins/jwt.js';

describe('jwt plugin', () => {
  let fastify: ReturnType<typeof Fastify>;

  before(async () => {
    fastify = Fastify({ logger: false });

    // Register config and cookie plugins before jwt
    await fastify.register(config);
    await fastify.register(cookie);
    await fastify.register(jwt);

    // Route to exercise setAuthCookie decorator
    fastify.get('/set-cookie', async (req: any, reply: any) => {
      const token = fastify.jwt.sign({ id: '42' });
      reply.setAuthCookie(token);
      return { ok: true };
    });
  });

  after(async () => {
    await fastify.close();
  });

  it('exposes jwt.sign and can create a token', async () => {
    assert.equal(typeof fastify.jwt.sign, 'function');
    const token = fastify.jwt.sign({ id: '42' });
    assert.ok(typeof token === 'string' && token.length > 0);
  });

  it('setAuthCookie sets an auth cookie in the response', async () => {
    const res = await fastify.inject({ method: 'GET', url: '/set-cookie' });
    assert.equal(res.statusCode, 200);
    const setCookie = res.headers['set-cookie'];
    assert.ok(setCookie, 'expected Set-Cookie header');
    const cookieHeader = Array.isArray(setCookie) ? setCookie.join(';') : String(setCookie);
    assert.match(cookieHeader, /authToken=/);
  });
});
