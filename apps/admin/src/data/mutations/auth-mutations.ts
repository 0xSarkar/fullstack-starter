import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { LoginRequest, LoginResponse } from '@fullstack-starter/shared-schemas';
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
