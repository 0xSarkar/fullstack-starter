import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loginApi, logoutApi } from '@fullstack-starter/shared-api';
import type { LoginRequest } from '@fullstack-starter/shared-schemas';
import { meQueryOptions } from '@/data/queries/auth-queries';
import { useAuthStore } from '@/stores/auth-store';

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

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const clearUser = useAuthStore((s) => s.clearUser);

  return useMutation({
    mutationFn: () => logoutApi(),
    onSuccess: () => {
      // Clear auth state first
      clearUser();

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
      queryClient.removeQueries();
    },
  });
}
