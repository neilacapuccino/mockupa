// STEP F4-F6 - incident requests (every one sends the token)
import { API_URL } from "./config";
import type { Incident } from "../types";


// GET /api/incidents  (STEP F4)
export const fetchIncidents = async (token: string | null): Promise<Incident[]> => {
  const res = await fetch(`${API_URL}/incidents`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// POST /api/incidents  (STEP F5)
export const createIncident = async (
  token: string | null,
  incident: Partial<Incident>
): Promise<Incident> => {
  const res = await fetch(`${API_URL}/incidents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(incident),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// PATCH /api/incidents/:id  (STEP F6)
export const updateIncident = async (
  token: string | null,
  id: string,
  changes: Partial<Incident>
): Promise<Incident> => {
  const res = await fetch(`${API_URL}/incidents/${id}`, {
    method: "PATCH",
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


// DELETE /api/incidents/:id  (STEP F6)
export const deleteIncident = async (token: string | null, id: string): Promise<Incident> => {
  const res = await fetch(`${API_URL}/incidents/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};
