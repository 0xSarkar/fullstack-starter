import { Type, Static } from '@sinclair/typebox';
import { SubscriptionDataSchema } from './stripe-schema.js';

// Common schemas
export const UserDataSchema = Type.Object({
  id: Type.String(),
  email: Type.String(),
  display_name: Type.Optional(Type.String()),
});

// User data with optional subscription
export const UserDataWithSubscriptionSchema = Type.Intersect([
  UserDataSchema,
  Type.Object({
    subscription: Type.Optional(SubscriptionDataSchema)
  })
]);

// Extended (optional) user data additions for social auth (kept separate to avoid breaking existing consumers)
export const UserProfileExtrasSchema = Type.Object({
  name: Type.Optional(Type.String()),
});
export const UserDataWithProfileSchema = Type.Intersect([
  UserDataSchema,
  UserProfileExtrasSchema
]);

// Auth request schemas
export const SignupRequestSchema = Type.Object({
  email: Type.String({ format: "email" }),
  password: Type.String({ minLength: 5 }),
});

export const LoginRequestSchema = Type.Object({
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 1 })
});

export const ForgotPasswordRequestSchema = Type.Object({
  email: Type.String({ format: 'email' })
});

export const ResetPasswordRequestSchema = Type.Object({
  token: Type.String(),
  newPassword: Type.String({ minLength: 5 }),
  confirmPassword: Type.String({ minLength: 5 })
});

export const UpdatePasswordRequestSchema = Type.Object({
  currentPassword: Type.String({ minLength: 1 }),
  newPassword: Type.String({ minLength: 5 })
});

// Auth response schemas
export const SignupResponseSchema = Type.Object({
  user: UserDataWithSubscriptionSchema,
  token: Type.String({
    description: 'JWT token for API authentication (use this for mobile apps)'
  })
});

export const LoginResponseSchema = Type.Object({
  user: UserDataWithSubscriptionSchema,
  token: Type.String({
    description: 'JWT token for API authentication (use this for mobile apps)'
  })
});

export const MeResponseSchema = Type.Object({
  user: UserDataWithSubscriptionSchema
});

// Google login (social) request schema
export const GoogleLoginRequestSchema = Type.Object({
  credential: Type.String({ description: 'Google ID token credential returned by Google Identity Services' })
});

// Response shape identical to existing login/signup responses for consistency
export const GoogleLoginResponseSchema = Type.Object({
  user: UserDataWithSubscriptionSchema,
  token: Type.String({ description: 'JWT token for API authentication (mirrors login/signup)' })
});

// TypeScript types derived from schemas
export type UserData = Static<typeof UserDataSchema>;
export type UserDataWithSubscription = Static<typeof UserDataWithSubscriptionSchema>;
export type SignupRequest = Static<typeof SignupRequestSchema>;
export type LoginRequest = Static<typeof LoginRequestSchema>;
export type ForgotPasswordRequest = Static<typeof ForgotPasswordRequestSchema>;
export type ResetPasswordRequest = Static<typeof ResetPasswordRequestSchema>;
export type UpdatePasswordRequest = Static<typeof UpdatePasswordRequestSchema>;
export type SignupResponse = Static<typeof SignupResponseSchema>;
export type LoginResponse = Static<typeof LoginResponseSchema>;
export type MeResponse = Static<typeof MeResponseSchema>;
export type GoogleLoginRequest = Static<typeof GoogleLoginRequestSchema>;
export type GoogleLoginResponse = Static<typeof GoogleLoginResponseSchema>;