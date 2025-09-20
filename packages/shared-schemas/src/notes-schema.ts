import { Type, type Static } from '@sinclair/typebox';
import { PaginationSchema } from './response-schema.js';

// Note request schemas
export const CreateNoteRequestSchema = Type.Object({
  title: Type.Optional(Type.String()),
  content: Type.Optional(Type.String())
});

export const UpdateNoteRequestSchema = Type.Object({
  title: Type.Optional(Type.String()),
  content: Type.Optional(Type.String())
});

export const NoteParamsSchema = Type.Object({
  id: Type.String({ format: 'uuid' })
});

export const ListNotesQuerySchema = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 }))
});

// Note response schemas
export const NoteDataSchema = Type.Object({
  id: Type.String(),
  title: Type.Union([Type.String(), Type.Null()]),
  content: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String(),
  updatedAt: Type.String()
});

export const NoteItemSchema = Type.Object({
  id: Type.String(),
  title: Type.Union([Type.String(), Type.Null()]),
  content: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String(),
  updatedAt: Type.String()
});

export const GetNoteResponseSchema = Type.Object({
  success: Type.Literal(true),
  data: NoteDataSchema,
  message: Type.Optional(Type.String())
});

export const CreateNoteResponseSchema = Type.Object({
  success: Type.Literal(true),
  data: Type.Object({
    id: Type.String(),
    title: Type.Union([Type.String(), Type.Null()]),
    content: Type.Union([Type.String(), Type.Null()]),
    createdAt: Type.String()
  }),
  message: Type.Optional(Type.String())
});

export const UpdateNoteResponseSchema = Type.Object({
  success: Type.Literal(true),
  data: Type.Object({
    id: Type.String(),
    title: Type.Union([Type.String(), Type.Null()]),
    content: Type.Union([Type.String(), Type.Null()]),
    updatedAt: Type.String()
  }),
  message: Type.Optional(Type.String())
});

export const DeleteNoteResponseSchema = Type.Object({
  success: Type.Literal(true),
  data: Type.Null(),
  message: Type.Optional(Type.String())
});

export const ListNotesResponseSchema = Type.Object({
  success: Type.Literal(true),
  data: Type.Array(NoteItemSchema),
  pagination: PaginationSchema,
  message: Type.Optional(Type.String())
});

// TypeScript types derived from schemas
export type CreateNoteRequest = Static<typeof CreateNoteRequestSchema>;
export type UpdateNoteRequest = Static<typeof UpdateNoteRequestSchema>;
export type NoteParams = Static<typeof NoteParamsSchema>;
export type ListNotesQuery = Static<typeof ListNotesQuerySchema>;
export type NoteData = Static<typeof NoteDataSchema>;
export type GetNoteResponse = Static<typeof GetNoteResponseSchema>;
export type CreateNoteResponse = Static<typeof CreateNoteResponseSchema>;
export type UpdateNoteResponse = Static<typeof UpdateNoteResponseSchema>;
export type NoteItem = Static<typeof NoteItemSchema>;
export type ListNotesResponse = Static<typeof ListNotesResponseSchema>;
export type DeleteNoteResponse = Static<typeof DeleteNoteResponseSchema>;