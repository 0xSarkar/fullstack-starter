import type {
  CreateNoteRequest,
  UpdateNoteRequest,
  NoteParams,
  ListNotesQuery,
  CreateNoteResponse,
  UpdateNoteResponse,
  ListNotesResponse,
} from '@fullstack-starter/shared-schemas';
import { defaultClient } from './client.js';

export async function createNote(data: CreateNoteRequest): Promise<CreateNoteResponse> {
  return defaultClient.post<CreateNoteResponse>('/notes', data);
}

export async function updateNote(id: string, data: UpdateNoteRequest): Promise<UpdateNoteResponse> {
  return defaultClient.put<UpdateNoteResponse>(`/notes/${id}`, data);
}

export async function getNote(id: string): Promise<any> { // Assuming a response type
  return defaultClient.get(`/notes/${id}`);
}

export async function listNotes(query?: ListNotesQuery): Promise<ListNotesResponse> {
  return defaultClient.get<ListNotesResponse>('/notes', query);
}

export async function deleteNote(id: string): Promise<void> {
  await defaultClient.delete(`/notes/${id}`);
}