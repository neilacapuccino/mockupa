// project + task requests (every one sends the token)
import { API_URL } from "./config";
import type { ProjectSummary, ProjectDetail, Task } from "../types";


// GET /api/projects
export const fetchProjects = async (token: string | null): Promise<ProjectSummary[]> => {
  const res = await fetch(`${API_URL}/projects`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// GET /api/projects/:id   -> the project + its tasks
export const fetchProject = async (token: string | null, id: string): Promise<ProjectDetail> => {
  const res = await fetch(`${API_URL}/projects/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// POST /api/projects
export const createProject = async (
  token: string | null,
  project: { name: string; description?: string; deadline?: string }
): Promise<ProjectSummary> => {
  const res = await fetch(`${API_URL}/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(project),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// DELETE /api/projects/:id   (409 if it still has unfinished tasks)
export const deleteProject = async (token: string | null, id: string) => {
  const res = await fetch(`${API_URL}/projects/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// POST /api/projects/:projectId/tasks   (nested route)
export const createTask = async (
  token: string | null,
  projectId: string,
  task: { title: string; priority: string }
): Promise<Task> => {
  const res = await fetch(`${API_URL}/projects/${projectId}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(task),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// PATCH /api/tasks/:id   (400 if you move the status backwards)
export const updateTask = async (
  token: string | null,
  id: string,
  changes: Partial<Task>
): Promise<Task> => {
  const res = await fetch(`${API_URL}/tasks/${id}`, {
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


// DELETE /api/tasks/:id
export const deleteTask = async (token: string | null, id: string): Promise<Task> => {
  const res = await fetch(`${API_URL}/tasks/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};
