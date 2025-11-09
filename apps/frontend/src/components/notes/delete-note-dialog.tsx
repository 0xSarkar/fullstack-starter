import { useRouter, useMatchRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { LoaderCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { useDeleteNoteMutation } from '@/data/mutations/notes-mutations';

export function DeleteNoteConfirmDialog() {
  const router = useRouter();
  const navigate = useNavigate();
  const search = useSearch({ from: '/_appLayout' });
  const deleteNoteId = search.deleteNoteId;

  const deleteNoteMutation = useDeleteNoteMutation();

  // Check if we're currently on a note page
  const matchRoute = useMatchRoute();
  const match = matchRoute({ to: '/notes/$noteId' });
  const currentNoteId = match ? match.noteId : null;

  const closeDeleteDialog = () => {
    navigate({
      to: '.',
      search: (prev) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { deleteNoteId, ...rest } = prev;
        return rest;
      },
    });
  };

  const handleDeleteNote = async () => {
    if (!deleteNoteId) {
      return;
    }

    try {
      await deleteNoteMutation.mutateAsync(deleteNoteId);
      if (currentNoteId === deleteNoteId) {
        router.navigate({ to: '/notes' });
      }
      closeDeleteDialog();
    } catch (error) {
      console.error('Failed to delete note:', error);
      // Error is already handled by the mutation
    }
  };

  return (
    <AlertDialog
      open={!!deleteNoteId}
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