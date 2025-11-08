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

  openDeleteDialog: (note: NoteData) => void;
  closeDeleteDialog: () => void;

  openEditDialog: (note: NoteData) => void;
  closeEditDialog: () => void;

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

  openDeleteDialog: (note: NoteData) => set({ deleteDialog: { isOpen: true, noteId: note.id } }),
  closeDeleteDialog: () => set({ deleteDialog: { isOpen: false, noteId: null } }),

  openEditDialog: (note: NoteData) => set({ editDialog: { isOpen: true, note } }),
  closeEditDialog: () => set({ editDialog: { isOpen: false, note: null } }),

  reset: () => set({
    deleteDialog: { isOpen: false, noteId: null },
    editDialog: { isOpen: false, note: null },
  }),
}));
