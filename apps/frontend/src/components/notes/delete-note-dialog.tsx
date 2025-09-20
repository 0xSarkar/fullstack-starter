import { useState } from 'react';
import { useRouter, useMatchRoute } from '@tanstack/react-router';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { useNotesStore } from '@/stores/notes-store';
import { LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { deleteNoteApi } from '@fullstack-starter/shared-api';

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
    setIsDeleting(true);
    try {
      await deleteNoteApi(noteToDelete!);
      if (currentNoteId === noteToDelete) {
        await router.navigate({ to: '/notes' });
      }
      await router.invalidate({ sync: true, filter: (r) => r.id === '/_appLayout' });
      setNoteToDelete(null);
    } catch (error: any) {
      console.error('Failed to delete note:', error);
      toast.error(error.message || "Failed to delete note. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog
      open={noteToDelete !== null}
      // Prevent the dialog from closing while a delete is in progress (e.g. escape key or overlay click)
      onOpenChange={(open) => {
        if (isDeleting) return; // ignore close attempts during deletion
        if (!open) setNoteToDelete(null);
      }}
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
          <AlertDialogAction
            // prevent Radix from auto-closing the dialog so the loading state is visible until the async flow finishes
            onClick={handleDeleteNote}
            disabled={isDeleting}
          >
            {isDeleting && <LoaderCircle className='animate-spin' />} Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}