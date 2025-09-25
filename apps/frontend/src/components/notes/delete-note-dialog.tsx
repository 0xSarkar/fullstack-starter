import { useState } from 'react';
import { useRouter, useMatchRoute } from '@tanstack/react-router';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { useNotesStore } from '@/stores/notes-store';
import { LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { deleteNoteApi } from '@fullstack-starter/shared-api';
import { Button } from '../ui/button';

export function DeleteNoteConfirmDialog() {
  const router = useRouter();

  const noteToDelete = useNotesStore(state => state.noteToDelete);
  const setNoteToDelete = useNotesStore((state) => state.setNoteToDelete);

  // Check if we're currently on a notes page
  const matchRoute = useMatchRoute();
  const match = matchRoute({ to: '/notes/$noteId' });
  const currentNoteId = match ? match.noteId : null;

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteNote = async () => {
    if (!noteToDelete) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteNoteApi(noteToDelete);
      if (currentNoteId === noteToDelete) {
        await router.invalidate({ sync: true, filter: (r) => r.routeId === '/_appLayout' });
        router.navigate({ to: '/notes' });
        setNoteToDelete(null);
      } else {
        await router.invalidate({ sync: true, filter: (r) => r.routeId === '/_appLayout' });
        setNoteToDelete(null);
      }
    } catch (error: unknown) {
      console.error('Failed to delete note:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete note. Please try again.';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog
      open={noteToDelete !== null}
      onOpenChange={(open) => { if (!open && !isDeleting) setNoteToDelete(null); }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Note</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this note? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <Button
            onClick={handleDeleteNote}
            disabled={isDeleting}
          >
            {isDeleting && <LoaderCircle className='animate-spin' />} Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}