import type {
  CreateNoteRequest,
  UpdateNoteRequest,
  ListNotesQuery,
  CreateNoteResponse,
  UpdateNoteResponse,
  ListNotesResponse,
  GetNoteResponse,
  DeleteNoteResponse,
} from '@fullstack-starter/shared-schemas';
import { defaultClient } from './client.js';

export async function createNoteApi(data: CreateNoteRequest): Promise<CreateNoteResponse> {
  return defaultClient.post<CreateNoteResponse>('/notes', data);
}

export async function updateNoteApi(id: string, data: UpdateNoteRequest): Promise<UpdateNoteResponse> {
  return defaultClient.patch<UpdateNoteResponse>(`/notes/${id}`, data);
}

export async function getNoteApi(id: string): Promise<GetNoteResponse> {
  return defaultClient.get<GetNoteResponse>(`/notes/${id}`);
}

export async function listNotesApi(query?: ListNotesQuery): Promise<ListNotesResponse> {
  return defaultClient.get<ListNotesResponse>('/notes', query);
}

export async function deleteNoteApi(id: string): Promise<DeleteNoteResponse> {
  return defaultClient.delete<DeleteNoteResponse>(`/notes/${id}`);
}