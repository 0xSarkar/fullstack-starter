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
export async function signupApi(data: SignupRequest): Promise<SignupResponse> {
  return defaultClient.post<SignupResponse>('/auth/signup', data);
}

/**
 * Log in an existing user
 */
export async function loginApi(data: LoginRequest): Promise<LoginResponse> {
  return defaultClient.post<LoginResponse>('/auth/login', data);
}

/**
 * Get current user information
 */
export async function meApi(): Promise<MeResponse> {
  return defaultClient.get<MeResponse>('/auth/me');
}

/**
 * Request password reset
 */
export async function forgotPasswordApi(data: ForgotPasswordRequest): Promise<void> {
  await defaultClient.post('/auth/forgot-password', data);
}

/**
 * Reset password using token
 */
export async function resetPasswordApi(data: ResetPasswordRequest): Promise<void> {
  await defaultClient.post('/auth/reset-password', data);
}

/**
 * Update current user's password
 */
export async function updatePasswordApi(data: UpdatePasswordRequest): Promise<void> {
  await defaultClient.put('/auth/update-password', data);
}

/**
 * Log out the current user
 */
export async function logoutApi(): Promise<void> {
  await defaultClient.post('/auth/logout', {});
}

/**
 * Google social login using ID token credential
 */
export async function googleLoginApi(data: GoogleLoginRequest): Promise<GoogleLoginResponse> {
  return defaultClient.post<GoogleLoginResponse>('/auth/google', data);
}