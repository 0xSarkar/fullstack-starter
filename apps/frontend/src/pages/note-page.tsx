import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useState, useRef } from 'react';
import Tiptap from '@/components/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Edit } from 'lucide-react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { noteQueryOptions } from '@/data/queries/notes-queries';
import { useUpdateNoteMutation } from '@/data/mutations/notes-mutations';

const route = getRouteApi('/_appLayout/notes_/$noteId');

export function NotePage() {
  const navigate = useNavigate();
  const { noteId } = route.useParams();
  const { data: noteResponse } = useSuspenseQuery(noteQueryOptions(noteId));
  const noteData = noteResponse.data;
  const [content, setContent] = useState(noteData.content || '');

  const updateNoteMutation = useUpdateNoteMutation();

  const openEditDialog = () => {
    navigate({ to: '.', search: (prev) => ({ ...prev, renameNoteId: noteData.id }) });
  };

  // Create the editor instance here
  const editor = useEditor({
    extensions: [StarterKit],
    content: '', // Initial content; we'll update it in useEffect
    onUpdate({ editor }) {
      setContent(editor.getHTML());
    },
  });

  const handleSave = useCallback(async () => {
    await updateNoteMutation.mutateAsync({
      noteId: noteData.id,
      data: { content },
    });
  }, [content, noteData.id, updateNoteMutation]);

  // Autosave on content change, skip initial load
  const firstRun = useRef(true);
  const isLoadingNote = useRef(false);
  useEffect(() => {
    if (!editor) return;
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    // Skip autosave if we're currently loading a new note
    if (isLoadingNote.current) return;
    const timeoutId = setTimeout(() => {
      void handleSave();
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [content, editor, handleSave]);

  // Replace content on initial load or when switching notes, but avoid on autosave reloads
  const prevNoteId = useRef<string | null>(null);
  useEffect(() => {
    if (!editor) return;
    // Only reset content when a new note is loaded
    if (prevNoteId.current !== noteData.id) {
      prevNoteId.current = noteData.id;
      isLoadingNote.current = true;
      setContent(noteData.content || '');
      editor.commands.setContent(noteData.content || '');
      // Reset the flag after a short delay to allow the content change to settle
      setTimeout(() => {
        isLoadingNote.current = false;
      }, 100);
    }
  }, [noteData.id, noteData.title, noteData.content, editor]);

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
            className='font-semibold text-base max-w-56 md:max-w-xs truncate cursor-pointer hover:underline hover:underline-offset-2 flex items-center gap-2'
            onClick={() => openEditDialog()}
          >
            <span className="truncate">{noteData?.title || 'Untitled Note'}</span>
            <Edit className="h-3.5 w-3.5 mt-0.5 text-muted-foreground flex-shrink-0 opacity-60 hover:opacity-100" />
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 h-full max-h-[calc(100svh-4rem)] md:max-h-[calc(100svh-5rem)]">
        <div className="w-full max-w-3xl mx-auto h-full">
          <Tiptap editor={editor} />
        </div>
      </div>
    </>
  );
}
