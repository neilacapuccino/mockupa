// item requests (every one sends the token)
import { API_URL } from "./config";
import type { Item } from "../types";


// GET /api/items
export const fetchItems = async (token: string | null): Promise<Item[]> => {
  const res = await fetch(`${API_URL}/items`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// POST /api/items   (admin only - staff gets 403)
export const createItem = async (
  token: string | null,
  item: { name: string; sku: string; quantity: number; price: number }
): Promise<Item> => {
  const res = await fetch(`${API_URL}/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(item),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// PATCH /api/items/:id/stock   body: { change: 1 } or { change: -1 }
export const changeStock = async (token: string | null, id: string, change: number): Promise<Item> => {
  const res = await fetch(`${API_URL}/items/${id}/stock`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ change }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// DELETE /api/items/:id   (admin only)
export const deleteItem = async (token: string | null, id: string): Promise<Item> => {
  const res = await fetch(`${API_URL}/items/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};
