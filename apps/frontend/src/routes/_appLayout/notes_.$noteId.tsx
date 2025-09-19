import { NotePage } from '@/pages/note-page';
import { getNoteApi } from '@fullstack-starter/shared-api';
import { createFileRoute } from '@tanstack/react-router';
import { useNotesStore } from '@/stores/notes-store';

export const Route = createFileRoute('/_appLayout/notes_/$noteId')({
  loader: async ({ params }) => {
    // Check if we have the note in store first
    const createdNote = useNotesStore.getState().createdNote;
    const setCreatedNote = useNotesStore.getState().setCreatedNote;
    if (createdNote && createdNote.id === params.noteId) {
      setCreatedNote(null);
      // Use the cached note
      return createdNote;
    }

    // Otherwise fetch from API
    const noteData = await getNoteApi(params.noteId!);
    // Store the fetched note in store for future use
    return noteData;
  },

  component: NotePage,
});
