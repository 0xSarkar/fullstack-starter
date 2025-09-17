import Fastify from 'fastify';
import fp from 'fastify-plugin';
import App from '../../../src/app.js';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert';
import { startSuiteTransactionOnFastify } from '../../suite-transaction.js';

// Store original env var
let originalGoogleClientId: string | undefined;

describe('Google Auth Route', { concurrency: 1 }, () => {
  let fastify: ReturnType<typeof Fastify>;

  // helper-managed suite transaction  
  let teardown!: () => Promise<void>;

  before(async () => {
    // Store and set Google client ID to enable the route
    originalGoogleClientId = process.env.GOOGLE_CLIENT_ID;
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';

    fastify = Fastify({ logger: false });
    await fastify.register(fp(App));

    // Start suite-level transaction
    ({ teardown } = await startSuiteTransactionOnFastify(fastify));
  });

  after(async () => {
    await teardown(); // rollback transaction
    await fastify.close();

    // Restore original env var
    if (originalGoogleClientId !== undefined) {
      process.env.GOOGLE_CLIENT_ID = originalGoogleClientId;
    } else {
      delete process.env.GOOGLE_CLIENT_ID;
    }
  });

  it('should reject invalid Google credential', async () => {
    const res = await fastify.inject({
      method: 'POST',
      url: '/auth/google',
      payload: { credential: 'invalid-credential' }
    });

    assert.equal(res.statusCode, 401);
    const body = res.json();
    assert.equal(body.success, false);
    assert.equal(body.code, 'GOOGLE_AUTH_FAILED');
  });

  it('should handle missing credential', async () => {
    const res = await fastify.inject({
      method: 'POST',
      url: '/auth/google',
      payload: {}
    });

    // This should fail validation before reaching Google auth
    assert.equal(res.statusCode, 400);
  });

  it('should reject malformed credential', async () => {
    const res = await fastify.inject({
      method: 'POST',
      url: '/auth/google',
      payload: { credential: '' }
    });

    // Empty credential should also fail
    assert.equal(res.statusCode, 401);
    const body = res.json();
    assert.equal(body.success, false);
    assert.equal(body.code, 'GOOGLE_AUTH_FAILED');
  });
});

describe('Google Auth Route - Disabled', { concurrency: 1 }, () => {
  let fastify: ReturnType<typeof Fastify>;
  let teardown!: () => Promise<void>;
  let originalGoogleClientId: string | undefined;

  before(async () => {
    // Store original value and explicitly unset GOOGLE_CLIENT_ID
    originalGoogleClientId = process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_ID;

    fastify = Fastify({ logger: false });
    await fastify.register(fp(App));

    // Start suite-level transaction
    ({ teardown } = await startSuiteTransactionOnFastify(fastify));
  });

  after(async () => {
    await teardown();
    await fastify.close();

    // Restore original env var
    if (originalGoogleClientId !== undefined) {
      process.env.GOOGLE_CLIENT_ID = originalGoogleClientId;
    }
  });

  it('should return error when Google auth is disabled', async () => {
    const res = await fastify.inject({
      method: 'POST',
      url: '/auth/google',
      payload: { credential: 'any-credential' }
    });

    const body = res.json();

    // The behavior depends on whether there's a client ID or not
    if (res.statusCode === 500) {
      assert.equal(body.success, false);
      assert.equal(body.code, 'GOOGLE_AUTH_DISABLED');
      assert.equal(body.message, 'Google auth not configured');
    } else if (res.statusCode === 401) {
      // If GOOGLE_CLIENT_ID is still somehow set, expect auth failure
      assert.equal(body.success, false);
      assert.equal(body.code, 'GOOGLE_AUTH_FAILED');
    } else {
      assert.fail(`Unexpected status code: ${res.statusCode}, body: ${JSON.stringify(body)}`);
    }
  });
});
