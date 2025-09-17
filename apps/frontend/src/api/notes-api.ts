import type {
  CreateNoteRequest,
  UpdateNoteRequest,
  ListNotesQuery,
} from '@fullstack-starter/api-schema';

import client from '@/lib/api-client';


/**
 * Create a new note
 */
async function createNote(body: CreateNoteRequest) {
  const { data, error } = await client.POST('/notes/', { body });
  if (error) throw error;
  return data.data;
}

/**
 * List notes with pagination
 */
async function listNotes(query?: ListNotesQuery) {
  const { data, error } = await client.GET('/notes/', { query });
  if (error) throw error;
  return data;
}

/**
 * Get a specific note by ID
 */
async function getNote(id: string) {
  const { data, error } = await client.GET('/notes/{id}', {
    params: {
      path: { id }
    }
  });
  if (error) throw error;
  return data.data;
}

/**
 * Update a specific note by ID
 */
async function updateNote(id: string, data: UpdateNoteRequest) {
  const { data: responseData, error } = await client.PATCH('/notes/{id}', {
    params: {
      path: { id }
    },
    body: data,
  });
  if (error) throw error;
  return responseData.data;
}

/**
 * Delete a specific note by ID
 */
async function deleteNote(id: string) {
  const { error } = await client.DELETE('/notes/{id}', {
    params: {
      path: { id }
    }
  });
  if (error) throw error;
}

/**
 * Notes API object containing all notes-related API functions
 */
export const notesApi = {
  createNote,
  listNotes,
  getNote,
  updateNote,
  deleteNote,
};