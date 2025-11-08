import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import {
  createNoteApi,
  updateNoteApi,
  deleteNoteApi,
} from '@fullstack-starter/shared-api';
import type {
  CreateNoteRequest,
  UpdateNoteRequest,
} from '@fullstack-starter/shared-schemas';
import { toast } from 'sonner';
import { notesQueryOptions, noteQueryOptions } from '@/data/queries/notes-queries';

export function useCreateNoteMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateNoteRequest) => createNoteApi(data),
    onSuccess: async (response) => {
      // Set the newly created note in the query cache
      queryClient.setQueryData(noteQueryOptions(response.data.id).queryKey, {
        success: true,
        data: {
          ...response.data,
          updatedAt: response.data.createdAt,
        },
      });

      // Invalidate the notes list query
      await queryClient.invalidateQueries({ queryKey: notesQueryOptions.queryKey });

      // Navigate to the new note - data is already in cache, no refetch needed
      await navigate({ to: '/notes/$noteId', params: { noteId: response.data.id } });
    },
    onError: (error: unknown) => {
      console.error('Failed to create note:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create note';
      toast.error(errorMessage);
    },
  });
}

export function useUpdateNoteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId, data }: { noteId: string; data: UpdateNoteRequest; }) =>
      updateNoteApi(noteId, data),
    onSuccess: async (_response, variables) => {
      // Invalidate the specific note query
      await queryClient.invalidateQueries({
        queryKey: noteQueryOptions(variables.noteId).queryKey,
      });

      // Invalidate the notes list query to update the sidebar
      await queryClient.invalidateQueries({ queryKey: notesQueryOptions.queryKey });
    },
    onError: (error: unknown) => {
      console.error('Failed to update note:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to save note';
      toast.error(message);
    },
  });
}

export function useRenameNoteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId, title }: { noteId: string; title: string; }) =>
      updateNoteApi(noteId, { title }),
    onSuccess: async (_response, variables) => {
      // Invalidate the specific note query
      await queryClient.invalidateQueries({
        queryKey: noteQueryOptions(variables.noteId).queryKey,
      });

      // Invalidate the notes list query to update the sidebar
      await queryClient.invalidateQueries({ queryKey: notesQueryOptions.queryKey });

      toast.success('Note renamed successfully!');
    },
    onError: (error: unknown) => {
      console.error('Failed to rename note:', error);
      // Don't show a toast here - let the component handle field errors
    },
  });
}

export function useDeleteNoteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (noteId: string) => deleteNoteApi(noteId),
    onSuccess: async (_response, noteId) => {
      // Remove the deleted note from the cache to prevent 404 refetches
      queryClient.removeQueries({ queryKey: noteQueryOptions(noteId).queryKey });

      // Invalidate the notes list query to update the sidebar
      await queryClient.invalidateQueries({ queryKey: notesQueryOptions.queryKey });

      toast.success('Note deleted successfully');
    },
    onError: (error: unknown) => {
      console.error('Failed to delete note:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to delete note. Please try again.';
      toast.error(message);
    },
  });
}
