import client from '@/lib/api-client';
import type { ListUsersQuery, UpdateUserRole, UpdateUserStatus } from '@fullstack-starter/api-schema';

/**
 * List users with pagination and filtering
 */
async function listUsers(query?: ListUsersQuery) {
  const { data, error } = await client.GET('/admin/users', { params: { query } });
  if (error) throw error;
  return data;
}

/**
 * Update user role
 */
async function updateUserRole(userId: string, data: UpdateUserRole) {
  const { data: responseData, error } = await client.PATCH('/admin/users/{userId}/role', {
    params: { path: { userId } },
    body: data,
  });
  if (error) throw error;
  return responseData;
}

/**
 * Update user active status (activate/deactivate)
 */
async function updateUserStatus(userId: string, data: UpdateUserStatus) {
  const { data: responseData, error } = await client.PATCH('/admin/users/{userId}/status', {
    params: { path: { userId } },
    body: data,
  });
  if (error) throw error;
  return responseData;
}

export const usersApi = {
  listUsers,
  updateUserRole,
  updateUserStatus
};
