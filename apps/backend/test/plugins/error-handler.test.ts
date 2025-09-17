import { describe, it, before, after } from 'node:test';
import * as assert from 'node:assert';
import Fastify from 'fastify';
import { Type } from '@sinclair/typebox';
import ErrorHandlerPlugin from '../../src/plugins/error-handler.js';

describe('error-handler plugin', () => {
  let fastify: ReturnType<typeof Fastify>;

  before(async () => {
    fastify = Fastify({ logger: false });
    await fastify.register(ErrorHandlerPlugin);

    // Route with a TypeBox schema for request body to trigger Fastify/Ajv validation
    fastify.post('/validation', {
      schema: {
        body: Type.Object({
          email: Type.String({ format: 'email' })
        })
      }
    }, async (req: any, reply: any) => {
      return { ok: true };
    });

    // Route that throws an error with a statusCode property (Fastify-style)
    fastify.get('/fastify-error', async () => {
      const e: any = new Error('Bad request occurred');
      e.statusCode = 400;
      throw e;
    });

    // Route that throws a generic error
    fastify.get('/generic-error', async () => {
      throw new Error('something broke');
    });
  });

  after(async () => {
    await fastify.close();
  });

  it('handles TypeBox-style validation errors and returns formatted details', async () => {
    const res = await fastify.inject({
      method: 'POST',
      url: '/validation',
      payload: {},
      headers: { 'content-type': 'application/json' }
    });
    assert.equal(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.equal(body.success, false);
    assert.equal(body.error, 'Validation failed');
    assert.equal(body.code, 'VALIDATION_ERROR');
    assert.ok(body.details && typeof body.details === 'object');
    assert.ok(Array.isArray(body.details.errors));
    assert.equal(body.details.errors.length, 1);
    assert.equal(body.details.errors[0].field, 'email');
    assert.equal(body.details.errors[0].message, 'Required field');
  });

  it('forwards Fastify errors with their status code and message', async () => {
    const res = await fastify.inject({ method: 'GET', url: '/fastify-error' });
    assert.equal(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.equal(body.success, false);
    assert.equal(body.error, 'Bad request occurred');
    // Note: Fastify errors may or may not have codes depending on the specific error
  });

  it('returns 500 for generic errors with the original message in non-production', async () => {
    // Ensure we are not in production for this test
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    const res = await fastify.inject({ method: 'GET', url: '/generic-error' });
    assert.equal(res.statusCode, 500);
    const body = JSON.parse(res.body);
    assert.equal(body.success, false);
    assert.equal(body.error, 'something broke');
    assert.equal(body.code, 'INTERNAL_ERROR');

    process.env.NODE_ENV = originalEnv;
  });

  it('hides internal error messages in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const res = await fastify.inject({ method: 'GET', url: '/generic-error' });
    assert.equal(res.statusCode, 500);
    const body = JSON.parse(res.body);
    assert.equal(body.success, false);
    // In production the plugin should not expose the raw error message
    assert.equal(body.error, 'Internal server error');
    assert.equal(body.code, 'INTERNAL_ERROR');

    process.env.NODE_ENV = originalEnv;
  });
});
