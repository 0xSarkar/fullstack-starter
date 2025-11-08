import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  loginApi,
  signupApi,
  logoutApi,
  googleLoginApi,
  forgotPasswordApi,
  resetPasswordApi,
} from '@fullstack-starter/shared-api';
import type {
  LoginRequest,
  SignupRequest,
  GoogleLoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '@fullstack-starter/shared-schemas';
import { toast } from 'sonner';
import { meQueryOptions } from '@/data/queries/auth-queries';
import { useAuthStore } from '@/stores/auth-store';
import { useNotesStore } from '@/stores/notes-store';

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (data: LoginRequest) => loginApi(data),
    onSuccess: (response) => {
      // Update auth state
      setUser(response.data.user);

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
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (data: SignupRequest) => signupApi(data),
    onSuccess: (response) => {
      // Update auth state
      setUser(response.data.user);

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
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (data: GoogleLoginRequest) => googleLoginApi(data),
    onSuccess: (response) => {
      // Update auth state
      setUser(response.data.user);

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
  const clearUser = useAuthStore((s) => s.clearUser);

  return useMutation({
    mutationFn: () => logoutApi(),
    onSuccess: () => {
      // Clear auth state first
      clearUser();

      // Clear notes store state
      useNotesStore.getState().reset();

      // Cancel any outgoing queries to prevent refetches
      queryClient.cancelQueries();

      // Remove all queries from cache instead of clearing
      // This prevents automatic refetches
      queryClient.removeQueries();
    },
    onError: (error: unknown) => {
      console.error('Logout failed:', error);
      // Even if logout fails on server, clear local state
      clearUser();
      useNotesStore.getState().reset();
      queryClient.cancelQueries();
      queryClient.removeQueries();
    },
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) => forgotPasswordApi(data),
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
    mutationFn: (data: ResetPasswordRequest) => resetPasswordApi(data),
    onSuccess: () => {
      toast.success('Password reset successfully! You can now log in with your new password.');
    },
    onError: (error: unknown) => {
      console.error('Reset password failed:', error);
      // Errors are handled in the component
    },
  });
}
