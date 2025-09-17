import { useLoaderData, useNavigate, useRouter, useMatch } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { notesApi } from '@/api/notes-api';
import { Button } from '@/components/ui/button';
import { useNotesStore } from '@/stores/notes-store';
import { LoaderCircle } from 'lucide-react';
import { useMutation } from '@/hooks/use-mutation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@radix-ui/react-separator';
import { NoteCard } from '@/components/notes/note-card';

export function NotesPage() {
  const { data: notes } = useLoaderData({ from: "/_appLayout" });
  const navigate = useNavigate();
  const router = useRouter();
  const setCreatedNote = useNotesStore(state => state.setCreatedNote);
  const parentMatch = useMatch({ from: "/_appLayout", shouldThrow: false });
  const isParentSettled = parentMatch?.status !== 'pending' && parentMatch?.isFetching === false;

  const createNoteMutation = useMutation(notesApi.createNote, {
    onSuccess: async (response) => {
      const noteData = { ...response, updatedAt: response.createdAt };
      setCreatedNote(noteData);
      await navigate({ to: '/notes/$noteId', params: { noteId: response.id } });
      router.invalidate();
    },
    onError: (error) => {
      console.error('Failed to create note:', error);
    }
  });

  const setNoteToDelete = useNotesStore((state) => state.setNoteToDelete);
  const setNoteToRename = useNotesStore((state) => state.setNoteToRename);

  // Don't show any UI until the loader data is settled
  if (!isParentSettled) {
    return null;
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-1 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <div
            className='font-semibold text-base max-w-56 md:max-w-xs truncate flex items-center gap-2'
          >
            <span className="truncate">All Notes</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 h-full">
        {notes && notes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {notes.map((item) => (
              <NoteCard key={item.id} note={item} onRename={setNoteToRename} onDelete={setNoteToDelete} />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-full">
            <Card className="w-full max-w-sm">
              <CardHeader className='text-center'>
                <CardTitle>No notes yet</CardTitle>
                <CardDescription>
                  Get started by creating your first note.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => createNoteMutation.mutate({ title: 'New Note', content: '' })}>
                  {createNoteMutation.isLoading && <LoaderCircle className='animate-spin' />} Create Note
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
