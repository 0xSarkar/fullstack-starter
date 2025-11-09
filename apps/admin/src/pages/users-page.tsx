import { useSearch } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@radix-ui/react-separator';
import { DataTable } from '@/components/users/data-table';
import { createColumns } from '@/components/users/columns';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { AdminUser, ListUsersQuery } from '@fullstack-starter/shared-schemas';
import { Route } from '@/routes/_appLayout/users';
import { Button } from '@/components/ui/button';
import { LoaderCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { usersQueryOptions } from '@/data/queries/users-queries';
import { useUpdateUserStatusMutation } from '@/data/mutations/users-mutations';

export function UsersPage() {
  const search = useSearch({ from: "/_appLayout/users" });
  const navigate = Route.useNavigate();

  // Build query params
  const page = Math.floor(search.offset / search.limit) + 1;
  const query: ListUsersQuery = {
    page,
    limit: search.limit,
    search: search.q,
    role: search.role as 'user' | 'admin' | 'super_admin' | undefined,
  };

  // Use TanStack Query hook
  const { data } = useQuery(usersQueryOptions(query));
  const updateUserStatusMutation = useUpdateUserStatusMutation();

  const [userToToggle, setUserToToggle] = useState<AdminUser | null>(null);
  const [searchQuery, setSearchQuery] = useState(search.q || '');

  // Keep local input state in sync if user navigates via history/back etc.
  useEffect(() => {
    const current = search.q || '';
    // Avoid cursor jump while typing same value
    if (current !== searchQuery) {
      setSearchQuery(current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.q]);

  // Debounce pushing query param changes to the router
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery !== (search.q || '')) {
        navigate({
          search: (prev) => ({ ...prev, q: searchQuery || undefined, offset: 0 }),
          replace: true,
        });
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, search.q, navigate]);

  const handleUserStatusToggle = (user: AdminUser) => {
    setUserToToggle(user);
  };

  const handleConfirmToggle = async () => {
    if (!userToToggle) return;

    try {
      await updateUserStatusMutation.mutateAsync({
        userId: userToToggle.id,
        active: !userToToggle.active,
      });
      toast.success(`User ${userToToggle.active ? 'deactivated' : 'activated'} successfully`);
    } finally {
      setUserToToggle(null);
    }
  };

  const handleCancelToggle = () => {
    setUserToToggle(null);
  };

  const handlePaginationChange = (newOffset: number) => {
    navigate({
      search: (prev) => ({ ...prev, offset: newOffset }),
      replace: true,
    });
  };

  const handleLimitChange = (newLimit: number) => {
    navigate({
      search: (prev) => ({ ...prev, limit: newLimit, offset: 0 }),
      replace: true,
    });
  };

  const columns = createColumns(handleUserStatusToggle);

  // Use data from query
  const users = data?.data || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: search.limit, totalPages: 0 };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-1 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <div className='font-semibold text-base max-w-56 md:max-w-xs truncate flex items-center gap-2'>
            User Management
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Manage user accounts, roles, and permissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={users as AdminUser[]}
              pagination={pagination}
              onPaginationChange={handlePaginationChange}
              onLimitChange={handleLimitChange}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!userToToggle} onOpenChange={() => setUserToToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {userToToggle?.active ? 'Deactivate' : 'Activate'} User
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {userToToggle?.active ? 'deactivate' : 'activate'} user "{userToToggle?.email}"?
              {userToToggle?.active && ' This will prevent them from accessing the application.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelToggle}>Cancel</AlertDialogCancel>
            <Button onClick={handleConfirmToggle} disabled={updateUserStatusMutation.isPending}>
              {updateUserStatusMutation.isPending && <LoaderCircle className='animate-spin' />} Confirm
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
