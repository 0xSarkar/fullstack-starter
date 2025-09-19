import { Static, Type } from '@sinclair/typebox';

// User role enum
export const UserRoleSchema = Type.Union([
  Type.Literal('user'),
  Type.Literal('admin'),
  Type.Literal('super_admin')
]);

// User response schema for admin operations
export const AdminUserSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  email: Type.String({ format: 'email' }),
  display_name: Type.Union([Type.String(), Type.Null()]),
  role: UserRoleSchema,
  active: Type.Boolean(),
  created_at: Type.String({ format: 'date-time' }),
  updated_at: Type.String({ format: 'date-time' }),
  stripe_customer_id: Type.Union([Type.String(), Type.Null()])
});

// List users query parameters
export const ListUsersQuerySchema = Type.Object({
  page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
  role: Type.Optional(UserRoleSchema),
  search: Type.Optional(Type.String({ minLength: 1 }))
});

// Update user role request
export const UpdateUserRoleSchema = Type.Object({
  role: UserRoleSchema
});

// Update user status request  
export const UpdateUserStatusSchema = Type.Object({
  active: Type.Boolean()
});

// User ID parameter schema
export const UserIdParamSchema = Type.Object({
  userId: Type.String({ format: 'uuid' })
});

// Export types for usage in other parts of the application
export type AdminUser = Static<typeof AdminUserSchema>;
export type ListUsersQuery = Static<typeof ListUsersQuerySchema>;
export type UpdateUserRole = Static<typeof UpdateUserRoleSchema>;
export type UpdateUserStatus = Static<typeof UpdateUserStatusSchema>;
export type UserIdParam = Static<typeof UserIdParamSchema>;