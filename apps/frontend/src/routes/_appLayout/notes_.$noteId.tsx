import { NotePage } from '@/pages/note-page';
import { createFileRoute } from '@tanstack/react-router';
import { noteQueryOptions } from '@/data/queries/notes-queries';

export const Route = createFileRoute('/_appLayout/notes_/$noteId')({
  loader: async ({ params, context: { queryClient } }) => {
    // Ensure data from API (will use cache if available from mutation)
    await queryClient.ensureQueryData(noteQueryOptions(params.noteId));
  },

  component: NotePage,
});
