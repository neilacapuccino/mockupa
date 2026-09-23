// event requests
import { API_URL } from "./config";
import type { EventItem } from "../types";


// GET /api/events        (token OPTIONAL - guests send no token)
// GET /api/events/mine   (token required)
export const fetchEvents = async (token: string | null, view: string): Promise<EventItem[]> => {
  // only add the Authorization header when we HAVE a token
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = view === "mine" ? `${API_URL}/events/mine` : `${API_URL}/events`;

  const res = await fetch(url, { headers });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// POST /api/events
export const createEvent = async (
  token: string | null,
  event: { title: string; venue: string; starts_at: string; capacity: number }
): Promise<EventItem> => {
  const res = await fetch(`${API_URL}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(event),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// POST /api/events/:id/register
export const registerForEvent = async (token: string | null, id: string): Promise<EventItem> => {
  const res = await fetch(`${API_URL}/events/${id}/register`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// DELETE /api/events/:id/register
export const cancelRegistration = async (token: string | null, id: string): Promise<EventItem> => {
  const res = await fetch(`${API_URL}/events/${id}/register`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};
