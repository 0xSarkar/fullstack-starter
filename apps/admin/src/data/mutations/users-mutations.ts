import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateUserStatus } from '@fullstack-starter/shared-schemas';
import { toast } from 'sonner';
import { http } from '@/lib/http';

export function useUpdateUserStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, active }: { userId: string; active: boolean; }) =>
      http.patch<void>(`/admin/users/${userId}/status`, { active } satisfies UpdateUserStatus),
    onSuccess: () => {
      // Invalidate all users queries to refetch the list
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: unknown) => {
      console.error('Failed to update user status:', error);
      const message = error instanceof Error ? error.message : 'Failed to update user status';
      toast.error(message);
    },
  });
}
