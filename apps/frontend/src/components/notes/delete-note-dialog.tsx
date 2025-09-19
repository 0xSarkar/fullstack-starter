import { useRouter, useMatchRoute } from '@tanstack/react-router';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { useNotesStore } from '@/stores/notes-store';
import { LoaderCircle } from 'lucide-react';
import { useMutation } from '@/hooks/use-mutation';
import { toast } from 'sonner';
import { deleteNoteApi } from '@fullstack-starter/shared-api';

export function DeleteNoteConfirmDialog() {
  const router = useRouter();
  const noteToDelete = useNotesStore((state) => state.noteToDelete);
  const setNoteToDelete = useNotesStore((state) => state.setNoteToDelete);

  // Check if we're currently on a notes page
  const matchRoute = useMatchRoute();
  const match = matchRoute({ to: '/notes/$noteId' });
  const currentNoteId = match ? match.noteId : null;

  const deleteNoteMutation = useMutation(deleteNoteApi, {
    onSuccess: async () => {
      // Check if the deleted note is currently being viewed
      if (currentNoteId === noteToDelete) {
        // Invalidate and Navigate away from the deleted note
        router.navigate({ to: '/notes' });
      }
      router.invalidate();
      setNoteToDelete(null);
    },
    onError: (error: any) => {
      console.error('Failed to delete note:', error);
      toast.error(error.message || "Failed to delete note. Please try again.");
      // Optionally, keep dialog open or show error state
    }
  });

  return (
    <AlertDialog open={noteToDelete !== null} onOpenChange={() => setNoteToDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Note</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this note? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteNoteMutation.isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => deleteNoteMutation.mutate(noteToDelete!)} disabled={deleteNoteMutation.isLoading}>
            {deleteNoteMutation.isLoading && <LoaderCircle className='animate-spin' />} Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}