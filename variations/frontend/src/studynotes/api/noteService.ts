// note requests (every one sends the token)
import { API_URL } from "./config";
import type { Note } from "../types";


// GET /api/notes?search=...
export const fetchNotes = async (token: string | null, search: string): Promise<Note[]> => {
  // only add ?search= when the user typed something
  const query = search ? `?search=${encodeURIComponent(search)}` : "";

  const res = await fetch(`${API_URL}/notes${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// POST /api/notes
export const createNote = async (token: string | null, note: Partial<Note>): Promise<Note> => {
  const res = await fetch(`${API_URL}/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(note),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// PUT /api/notes/:id
export const updateNote = async (
  token: string | null,
  id: string,
  changes: Partial<Note>
): Promise<Note> => {
  const res = await fetch(`${API_URL}/notes/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(changes),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// DELETE /api/notes/:id
export const deleteNote = async (token: string | null, id: string): Promise<Note> => {
  const res = await fetch(`${API_URL}/notes/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};
