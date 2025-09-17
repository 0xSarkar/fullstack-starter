import Fastify from 'fastify';
import fp from 'fastify-plugin';
import App from '../../../src/app.js';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { startSuiteTransactionOnFastify } from '../../suite-transaction.js';

describe('Reset Password Route', { concurrency: 1 }, () => {
  let fastify: ReturnType<typeof Fastify>;

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

  it('should reset password with a valid token', async () => {
    const email = `test-reset-success-${Date.now()}@example.com`;
    const originalPassword = 'OriginalPass1!';
    const newPassword = 'NewPass1!';

    // create user
    const signupRes = await fastify.inject({ method: 'POST', url: '/auth/signup', payload: { email, password: originalPassword } });
    assert.equal(signupRes.statusCode, 201);

    const userRow = await fastify.kysely.selectFrom('users').select(['id', 'password_hash']).where('email', '=', email).executeTakeFirst();
    assert.ok(userRow && userRow.id);

    // create a token and store its hash
    const token = `reset-token-${Date.now()}`;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await fastify.kysely.insertInto('password_reset_tokens').values({ user_id: userRow.id, token_hash: tokenHash, expires_at: expiresAt }).execute();

    // call reset-password
    const res = await fastify.inject({ method: 'POST', url: '/auth/reset-password', payload: { token, newPassword, confirmPassword: newPassword } });
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.success, true);
    assert.equal(body.data, null);
    assert.equal(body.message, 'Password updated successfully');

    // verify token marked used and password updated
    const tokenRow = await fastify.kysely.selectFrom('password_reset_tokens').selectAll().where('user_id', '=', userRow.id).orderBy('created_at', 'desc').executeTakeFirst();
    assert.ok(tokenRow.used === true);

    const updatedUser = await fastify.kysely.selectFrom('users').select(['password_hash']).where('id', '=', userRow.id).executeTakeFirst();
    assert.ok(updatedUser && await bcrypt.compare(newPassword, updatedUser.password_hash));
  });

  it('should reject reuse of the same token', async () => {
    const email = `test-reset-reuse-${Date.now()}@example.com`;
    const originalPassword = 'OriginalPass2!';
    const newPassword = 'NewPass2!';

    // create user
    const signupRes = await fastify.inject({ method: 'POST', url: '/auth/signup', payload: { email, password: originalPassword } });
    assert.equal(signupRes.statusCode, 201);

    const userRow = await fastify.kysely.selectFrom('users').select(['id']).where('email', '=', email).executeTakeFirst();
    assert.ok(userRow && userRow.id);

    // create token and mark used after first reset
    const token = `reuse-token-${Date.now()}`;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await fastify.kysely.insertInto('password_reset_tokens').values({ user_id: userRow.id, token_hash: tokenHash, expires_at: expiresAt }).execute();

    // first reset should succeed
    const r1 = await fastify.inject({ method: 'POST', url: '/auth/reset-password', payload: { token, newPassword, confirmPassword: newPassword } });
    assert.equal(r1.statusCode, 200);

    // second attempt using same token should fail with 401
    const r2 = await fastify.inject({ method: 'POST', url: '/auth/reset-password', payload: { token, newPassword: 'AnotherPass!', confirmPassword: 'AnotherPass!' } });
    assert.equal(r2.statusCode, 401);
    const body2 = r2.json();
    assert.equal(body2.success, false);
  });

  it('should reject when new password is same as current password', async () => {
    const email = `test-reset-same-${Date.now()}@example.com`;
    const originalPassword = 'SamePassword123!';

    // create user
    const signupRes = await fastify.inject({ method: 'POST', url: '/auth/signup', payload: { email, password: originalPassword } });
    assert.equal(signupRes.statusCode, 201);

    const userRow = await fastify.kysely.selectFrom('users').select(['id']).where('email', '=', email).executeTakeFirst();
    assert.ok(userRow && userRow.id);

    // create token
    const token = `samepw-token-${Date.now()}`;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await fastify.kysely.insertInto('password_reset_tokens').values({ user_id: userRow.id, token_hash: tokenHash, expires_at: expiresAt }).execute();

    // attempt to reset using the same password
    const res = await fastify.inject({ method: 'POST', url: '/auth/reset-password', payload: { token, newPassword: originalPassword, confirmPassword: originalPassword } });
    assert.equal(res.statusCode, 422);
    const body = res.json();
    assert.equal(body.success, false);
    assert.equal(body.code, 'SAME_PASSWORD');
    assert.equal(body.error, 'New password must be different from the old password');
  });
});
