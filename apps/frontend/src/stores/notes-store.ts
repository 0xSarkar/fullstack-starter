import type { NoteData } from '@fullstack-starter/shared-schemas';
import { create } from 'zustand';

interface NotesStore {
  deleteDialog: {
    isOpen: boolean;
    noteId: string | null;
  };

  editDialog: {
    isOpen: boolean;
    note: NoteData | null;
  };

  createdNote: NoteData | null;

  openDeleteDialog: (note: NoteData) => void;
  closeDeleteDialog: () => void;

  openEditDialog: (note: NoteData) => void;
  closeEditDialog: () => void;

  setCreatedNote: (note: NoteData | null) => void;

  reset: () => void;
}

export const useNotesStore = create<NotesStore>((set) => ({
  deleteDialog: {
    isOpen: false,
    noteId: null,
  },

  editDialog: {
    isOpen: false,
    note: null,
  },

  createdNote: null,

  openDeleteDialog: (note: NoteData) => set({ deleteDialog: { isOpen: true, noteId: note.id } }),
  closeDeleteDialog: () => set({ deleteDialog: { isOpen: false, noteId: null } }),

  openEditDialog: (note: NoteData) => set({ editDialog: { isOpen: true, note } }),
  closeEditDialog: () => set({ editDialog: { isOpen: false, note: null } }),

  setCreatedNote: (note: NoteData | null) => set({ createdNote: note }),

  reset: () => set({
    deleteDialog: { isOpen: false, noteId: null },
    createdNote: null,
    editDialog: { isOpen: false, note: null },
  }),
}));
