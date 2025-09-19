import type {
  SignupRequest,
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UpdatePasswordRequest,
  SignupResponse,
  LoginResponse,
  MeResponse,
  GoogleLoginRequest,
  GoogleLoginResponse,
} from '@fullstack-starter/shared-schemas';
import { defaultClient } from './client.js';

/**
 * Sign up a new user
 */
export async function signup(data: SignupRequest): Promise<SignupResponse> {
  return defaultClient.post<SignupResponse>('/auth/signup', data);
}

/**
 * Log in an existing user
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  return defaultClient.post<LoginResponse>('/auth/login', data);
}

/**
 * Get current user information
 */
export async function me(): Promise<MeResponse> {
  return defaultClient.get<MeResponse>('/auth/me');
}

/**
 * Request password reset
 */
export async function forgotPassword(data: ForgotPasswordRequest): Promise<void> {
  await defaultClient.post('/auth/forgot-password', data);
}

/**
 * Reset password using token
 */
export async function resetPassword(data: ResetPasswordRequest): Promise<void> {
  await defaultClient.post('/auth/reset-password', data);
}

/**
 * Update current user's password
 */
export async function updatePassword(data: UpdatePasswordRequest): Promise<void> {
  await defaultClient.put('/auth/update-password', data);
}

/**
 * Log out the current user
 */
export async function logout(): Promise<void> {
  await defaultClient.post('/auth/logout');
}

/**
 * Google social login using ID token credential
 */
export async function googleLogin(data: GoogleLoginRequest): Promise<GoogleLoginResponse> {
  return defaultClient.post<GoogleLoginResponse>('/auth/google', data);
}