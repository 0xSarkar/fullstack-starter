import { useState } from 'react';
import { useRouter, useMatchRoute } from '@tanstack/react-router';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { deleteNoteApi } from '@fullstack-starter/shared-api';
import { Button } from '../ui/button';
import { useNotesStore } from '@/stores/notes-store';

export function DeleteNoteConfirmDialog() {
  const router = useRouter();

  const closeDeleteDialog = useNotesStore(state => state.closeDeleteDialog);
  const deleteDialog = useNotesStore(state => state.deleteDialog);

  // Check if we're currently on a note page
  const matchRoute = useMatchRoute();
  const match = matchRoute({ to: '/notes/$noteId' });
  const currentNoteId = match ? match.noteId : null;

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteNote = async () => {
    if (!deleteDialog.noteId) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteNoteApi(deleteDialog.noteId);
      if (currentNoteId === deleteDialog.noteId) {
        await router.invalidate({ sync: true, filter: (r) => r.routeId === '/_appLayout' });
        router.navigate({ to: '/notes' });
      } else {
        await router.invalidate({ sync: true, filter: (r) => r.routeId === '/_appLayout' });
      }
      closeDeleteDialog();
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
      open={deleteDialog.isOpen}
      onOpenChange={(open) => { if (!open && !isDeleting) closeDeleteDialog(); }}
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