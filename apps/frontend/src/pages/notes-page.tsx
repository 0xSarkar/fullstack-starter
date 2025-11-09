import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoaderCircle } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@radix-ui/react-separator';
import { NoteCard } from '@/components/notes/note-card';
import { useSuspenseQuery } from '@tanstack/react-query';
import { notesQueryOptions } from '@/data/queries/notes-queries';
import { useCreateNoteMutation } from '@/data/mutations/notes-mutations';
import { useNavigate } from '@tanstack/react-router';
import type { NoteData } from '@fullstack-starter/shared-schemas';

export function NotesPage() {
  const navigate = useNavigate();
  const { data: notesData } = useSuspenseQuery(notesQueryOptions);
  const notes = notesData.data;

  const createNoteMutation = useCreateNoteMutation();

  const handleCreateNote = async () => {
    await createNoteMutation.mutateAsync({ title: 'New Note', content: '' });
  };

  const openDeleteDialog = (note: NoteData) => {
    navigate({ to: '.', search: (prev) => ({ ...prev, deleteNoteId: note.id }) });
  };

  const openEditDialog = (note: NoteData) => {
    navigate({ to: '.', search: (prev) => ({ ...prev, renameNoteId: note.id }) });
  };

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
              <NoteCard key={item.id} note={item} onRename={() => openEditDialog(item)} onDelete={() => openDeleteDialog(item)} />
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
                <Button className="w-full" onClick={() => handleCreateNote()} disabled={createNoteMutation.isPending}>
                  {createNoteMutation.isPending && <LoaderCircle className='animate-spin' />} Create Note
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
