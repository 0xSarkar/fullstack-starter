import { queryOptions } from '@tanstack/react-query';
import { listNotesApi, getNoteApi } from '@fullstack-starter/shared-api';

export const notesQueryOptions = queryOptions({
  queryKey: ['notes'],
  queryFn: () => listNotesApi(),
});

export const noteQueryOptions = (noteId: string) =>
  queryOptions({
    queryKey: ['notes', noteId],
    queryFn: () => getNoteApi(noteId),
  });
