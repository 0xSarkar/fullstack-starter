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
export async function listUsers(query?: ListUsersQuery): Promise<PaginatedResponse<AdminUser>> {
  return defaultClient.get<PaginatedResponse<AdminUser>>('/admin/users', query);
}

/**
 * Update user role
 */
export async function updateUserRole(userId: string, data: UpdateUserRole): Promise<void> {
  await defaultClient.patch(`/admin/users/${userId}/role`, data);
}

/**
 * Update user active status (activate/deactivate)
 */
export async function updateUserStatus(userId: string, data: UpdateUserStatus): Promise<void> {
  await defaultClient.patch(`/admin/users/${userId}/status`, data);
}