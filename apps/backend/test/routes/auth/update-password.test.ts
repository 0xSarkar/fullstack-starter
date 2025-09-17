import Fastify from 'fastify';
import fp from 'fastify-plugin';
import App from '../../../src/app.js';
import { after, before, describe, it } from "node:test";
import assert from 'node:assert';
import { startSuiteTransactionOnFastify } from '../../suite-transaction.js';

describe("Update Password Route", { concurrency: 1 }, () => {
  // Test cases for updating password
  let fastify: ReturnType<typeof Fastify>;
  // Generate unique email for this test run
  const uniqueEmail = `test-update-password-${Date.now()}@example.com`;
  let token: string;

  // helper-managed suite transaction
  let teardown!: () => Promise<void>;

  before(async () => {
    fastify = Fastify({
      logger: false // Disable logging during tests
    });
    // Register our application as a plugin
    await fastify.register(fp(App));

    // Start suite-level transaction
    ({ teardown } = await startSuiteTransactionOnFastify(fastify));

    // First, create a user to test with
    const signupResponse = await fastify.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: {
        email: uniqueEmail,
        password: 'originalPassword123'
      }
    });

    if (signupResponse.statusCode !== 201) {
      console.error('Failed to create user for tests:', signupResponse.body);
    } else {
      const signupData = signupResponse.json();
      if (!signupData.data.token) {
        console.error('Failed to retrieve token from signup response:', signupData);
      } else {
        token = signupData.data.token;
      }
    }
  });

  after(async () => {
    await teardown(); // rollback transaction
    await fastify.close();
  });

  it('should update password successfully with valid credentials', async () => {
    const response = await fastify.inject({
      method: 'PUT',
      url: '/auth/update-password',
      headers: {
        authorization: `Bearer ${token}`
      },
      payload: {
        currentPassword: 'originalPassword123',
        newPassword: 'newPassword456'
      }
    });

    assert.equal(response.statusCode, 200);
    const responseData = response.json();
    assert.equal(responseData.success, true);
    assert.equal(responseData.message, 'Password updated successfully');
  });

  it('should verify new password works for login', async () => {
    const loginResponse = await fastify.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: uniqueEmail,
        password: 'newPassword456'
      }
    });

    assert.equal(loginResponse.statusCode, 200);
    const loginData = loginResponse.json();
    assert.equal(loginData.success, true);
  });

  it('should reject login with old password', async () => {
    const loginResponse = await fastify.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: uniqueEmail,
        password: 'originalPassword123'
      }
    });

    assert.equal(loginResponse.statusCode, 401);
    const loginData = loginResponse.json();
    assert.equal(loginData.success, false);
  });

  it('should reject update with incorrect current password', async () => {
    const response = await fastify.inject({
      method: 'PUT',
      url: '/auth/update-password',
      headers: {
        authorization: `Bearer ${token}`
      },
      payload: {
        currentPassword: 'wrongPassword',
        newPassword: 'anotherNewPassword789'
      }
    });

    assert.equal(response.statusCode, 401);
    const responseData = response.json();
    assert.equal(responseData.success, false);
    assert.equal(responseData.error, 'Current password is incorrect');
  });

  it('should reject update with same password', async () => {
    const response = await fastify.inject({
      method: 'PUT',
      url: '/auth/update-password',
      headers: {
        authorization: `Bearer ${token}`
      },
      payload: {
        currentPassword: 'newPassword456',
        newPassword: 'newPassword456'
      }
    });

    assert.equal(response.statusCode, 422);
    const responseData = response.json();
    assert.equal(responseData.success, false);
    assert.equal(responseData.error, 'New password cannot be the same as current password');
  });

  it('should require authentication', async () => {
    const response = await fastify.inject({
      method: 'PUT',
      url: '/auth/update-password',
      payload: {
        currentPassword: 'newPassword456',
        newPassword: 'anotherPassword789'
      }
    });

    assert.equal(response.statusCode, 401);
  });

  it('should validate request body', async () => {
    const response = await fastify.inject({
      method: 'PUT',
      url: '/auth/update-password',
      headers: {
        authorization: `Bearer ${token}`
      },
      payload: {
        currentPassword: '',
        newPassword: '123' // Too short
      }
    });

    assert.equal(response.statusCode, 400);
  });
});