import { useRouter, useMatchRoute } from '@tanstack/react-router';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { LoaderCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { useNotesStore } from '@/stores/notes-store';
import { useDeleteNoteMutation } from '@/data/mutations/notes-mutations';

export function DeleteNoteConfirmDialog() {
  const router = useRouter();

  const closeDeleteDialog = useNotesStore(state => state.closeDeleteDialog);
  const deleteDialog = useNotesStore(state => state.deleteDialog);
  const deleteNoteMutation = useDeleteNoteMutation();

  // Check if we're currently on a note page
  const matchRoute = useMatchRoute();
  const match = matchRoute({ to: '/notes/$noteId' });
  const currentNoteId = match ? match.noteId : null;

  const handleDeleteNote = async () => {
    if (!deleteDialog.noteId) {
      return;
    }

    try {
      await deleteNoteMutation.mutateAsync(deleteDialog.noteId);
      if (currentNoteId === deleteDialog.noteId) {
        router.navigate({ to: '/notes' });
      }
      closeDeleteDialog();
    } catch (error) {
      // Error is already handled by the mutation
    }
  };

  return (
    <AlertDialog
      open={deleteDialog.isOpen}
      onOpenChange={(open) => { if (!open && !deleteNoteMutation.isPending) closeDeleteDialog(); }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Note</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this note? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteNoteMutation.isPending}>Cancel</AlertDialogCancel>
          <Button
            onClick={handleDeleteNote}
            disabled={deleteNoteMutation.isPending}
          >
            {deleteNoteMutation.isPending && <LoaderCircle className='animate-spin' />} Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}