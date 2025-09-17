import { NotesPage } from '@/pages/notes-page';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_appLayout/notes')({
  component: NotesPage,
});