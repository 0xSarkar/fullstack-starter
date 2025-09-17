import type {
  SignupRequest,
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UpdatePasswordRequest,
  GoogleLoginResponse,
} from '@fullstack-starter/api-schema';

import client from '@/lib/api-client';

/**
 * Sign up a new user
 */
async function signup(data: SignupRequest) {
  const { data: responseData, error } = await client.POST('/auth/signup', { body: data });
  if (error) throw error;
  return responseData.data;
}

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
 * Request password reset
 */
async function forgotPassword(data: ForgotPasswordRequest) {
  const { error } = await client.POST('/auth/forgot-password', { body: data });
  if (error) throw error;
}

/**
 * Reset password using token
 */
async function resetPassword(data: ResetPasswordRequest) {
  const { error } = await client.POST('/auth/reset-password', { body: data });
  if (error) throw error;
}

/**
 * Update current user's password
 */
async function updatePassword(data: UpdatePasswordRequest): Promise<void> {
  const { error } = await client.PUT('/auth/update-password', { body: data });
  if (error) throw error;
}

/**
 * Log out the current user
 */
async function logout(): Promise<void> {
  const { error } = await client.POST('/auth/logout');
  if (error) throw error;
}

/**
 * Google social login using ID token credential
 */
async function googleLogin(data: { credential: string; }): Promise<GoogleLoginResponse> {
  const { data: responseData, error } = await client.POST('/auth/google', { body: data });
  if (error) throw error;
  return responseData.data;
}

/**
 * Auth API object containing all authentication-related API functions
 */
export const authApi = {
  signup,
  login,
  me,
  forgotPassword,
  resetPassword,
  updatePassword,
  logout,
  googleLogin,
};