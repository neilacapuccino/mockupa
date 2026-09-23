// book requests (every one sends the token)
import { API_URL } from "./config";
import type { Book } from "../types";


// GET /api/books  (+ ?available=true / false depending on the filter)
export const fetchBooks = async (token: string | null, filter: string): Promise<Book[]> => {
  let query = "";
  if (filter === "available") query = "?available=true";
  if (filter === "borrowed") query = "?available=false";

  const res = await fetch(`${API_URL}/books${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// POST /api/books
export const createBook = async (
  token: string | null,
  book: { title: string; author: string; published_year: number }
): Promise<Book> => {
  const res = await fetch(`${API_URL}/books`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(book),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// PATCH /api/books/:id/borrow   (no body needed)
export const borrowBook = async (token: string | null, id: string): Promise<Book> => {
  const res = await fetch(`${API_URL}/books/${id}/borrow`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// PATCH /api/books/:id/return   (no body needed)
export const returnBook = async (token: string | null, id: string): Promise<Book> => {
  const res = await fetch(`${API_URL}/books/${id}/return`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// DELETE /api/books/:id
export const deleteBook = async (token: string | null, id: string): Promise<Book> => {
  const res = await fetch(`${API_URL}/books/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};
