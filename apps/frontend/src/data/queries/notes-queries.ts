import { queryOptions } from '@tanstack/react-query';
import type { ListNotesResponse, GetNoteResponse } from '@fullstack-starter/shared-schemas';
import { http } from '@/lib/http';

export const notesQueryOptions = queryOptions({
  queryKey: ['notes'],
  queryFn: () => http.get<ListNotesResponse>('/notes'),
});

export const noteQueryOptions = (noteId: string) =>
  queryOptions({
    queryKey: ['notes', noteId],
    queryFn: () => http.get<GetNoteResponse>(`/notes/${noteId}`),
  });
