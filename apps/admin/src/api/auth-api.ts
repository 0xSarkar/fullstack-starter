import type {
  LoginRequest,
} from '@fullstack-starter/api-schema';

import client from '@/lib/api-client';

/**
 * Log in an existing user
 */
async function login(data: LoginRequest) {
  const { data: responseData, error } = await client.POST('/auth/login', { body: data });
  if (error) throw error;
  return responseData.data;
}

/**
 * Get current user information
 */
async function me() {
  const { data: responseData, error } = await client.GET('/auth/me');
  if (error) throw error;
  return responseData.data;
}

/**
 * Log out the current user
 */
async function logout() {
  const { error } = await client.POST('/auth/logout');
  if (error) throw error;
}

/**
 * Auth API object containing all authentication-related API functions
 */
export const authApi = {
  login,
  me,
  logout,
};