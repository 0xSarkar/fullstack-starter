import { create } from 'zustand';
import type { NoteData } from '@fullstack-starter/api-schema';

interface NotesStore {
  noteToDelete: string | null;
  setNoteToDelete: (noteId: string | null) => void;
  createdNote: NoteData | null;
  setCreatedNote: (note: NoteData | null) => void;
  noteToRename: NoteData | null;
  setNoteToRename: (note: NoteData | null) => void;
  reset: () => void;
}

export const useNotesStore = create<NotesStore>((set) => ({
  noteToDelete: null,
  setNoteToDelete: (noteId: string | null) => set({ noteToDelete: noteId }),
  createdNote: null,
  setCreatedNote: (note: NoteData | null) => set({ createdNote: note }),
  noteToRename: null,
  setNoteToRename: (note: NoteData | null) => set({ noteToRename: note }),
  reset: () => set({ noteToDelete: null, createdNote: null, noteToRename: null }),
}));
