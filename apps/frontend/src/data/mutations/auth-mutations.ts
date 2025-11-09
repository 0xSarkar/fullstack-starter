import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
  GoogleLoginRequest,
  GoogleLoginResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '@fullstack-starter/shared-schemas';
import { toast } from 'sonner';
import { meQueryOptions } from '@/data/queries/auth-queries';
import { http } from '@/lib/http';

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginRequest) => http.post<LoginResponse>('/auth/login', data),
    onSuccess: (response) => {
      // Update the me query cache
      queryClient.setQueryData(meQueryOptions.queryKey, response);
    },
    onError: (error: unknown) => {
      console.error('Login failed:', error);
      // Errors are handled in the component
    },
  });
}

export function useSignupMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SignupRequest) => http.post<SignupResponse>('/auth/signup', data),
    onSuccess: (response) => {
      // Update the me query cache
      queryClient.setQueryData(meQueryOptions.queryKey, response);
    },
    onError: (error: unknown) => {
      console.error('Signup failed:', error);
      // Errors are handled in the component
    },
  });
}

export function useGoogleLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GoogleLoginRequest) => http.post<GoogleLoginResponse>('/auth/google', data),
    onSuccess: (response) => {
      // Update the me query cache
      queryClient.setQueryData(meQueryOptions.queryKey, response);
    },
    onError: (error: unknown) => {
      console.error('Google login failed:', error);
      const message = error instanceof Error ? error.message : 'Google login failed';
      toast.error(message);
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => http.post('/auth/logout', {}),
    onSuccess: () => {
      // Cancel any outgoing queries to prevent refetches
      queryClient.cancelQueries();

      // Remove all queries from cache instead of clearing
      // This prevents automatic refetches
      queryClient.removeQueries();
    },
    onError: (error: unknown) => {
      console.error('Logout failed:', error);
      // Even if logout fails on server, clear local state
      queryClient.cancelQueries();
      queryClient.removeQueries();
    },
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) => http.post('/auth/forgot-password', data),
    onSuccess: () => {
      toast.success('Password reset link sent! Check your email.');
    },
    onError: (error: unknown) => {
      console.error('Forgot password failed:', error);
      // Errors are handled in the component
    },
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: (data: ResetPasswordRequest) => http.post('/auth/reset-password', data),
    onSuccess: () => {
      toast.success('Password reset successfully! You can now log in with your new password.');
    },
    onError: (error: unknown) => {
      console.error('Reset password failed:', error);
      // Errors are handled in the component
    },
  });
}
