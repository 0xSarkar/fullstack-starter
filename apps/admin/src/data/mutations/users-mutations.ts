import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateUserStatusApi } from '@fullstack-starter/shared-api';
import { toast } from 'sonner';

export function useUpdateUserStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, active }: { userId: string; active: boolean; }) =>
      updateUserStatusApi(userId, { active }),
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
