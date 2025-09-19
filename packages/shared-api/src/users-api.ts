import type {
  ListUsersQuery,
  UpdateUserRole,
  UpdateUserStatus,
  AdminUser,
  PaginatedResponse,
} from '@fullstack-starter/shared-schemas';
import { defaultClient } from './client.js';

/**
 * List users with pagination and filtering
 */
export async function listUsersApi(query?: ListUsersQuery): Promise<PaginatedResponse<AdminUser>> {
  return defaultClient.get<PaginatedResponse<AdminUser>>('/admin/users', query);
}

/**
 * Update user role
 */
export async function updateUserRoleApi(userId: string, data: UpdateUserRole): Promise<void> {
  await defaultClient.patch(`/admin/users/${userId}/role`, data);
}

/**
 * Update user active status (activate/deactivate)
 */
export async function updateUserStatusApi(userId: string, data: UpdateUserStatus): Promise<void> {
  await defaultClient.patch(`/admin/users/${userId}/status`, data);
}