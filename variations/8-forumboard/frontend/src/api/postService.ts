// post requests
import { API_URL } from "./config";
import type { Post } from "../types";


// GET /api/posts   (PUBLIC -> no token needed)
export const fetchPosts = async (): Promise<Post[]> => {
  const res = await fetch(`${API_URL}/posts`);

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// POST /api/posts
export const createPost = async (
  token: string | null,
  post: { title: string; body: string }
): Promise<Post> => {
  const res = await fetch(`${API_URL}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(post),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// PUT /api/posts/:id   (403 if it's not your post)
export const updatePost = async (
  token: string | null,
  id: string,
  changes: { title?: string; body?: string }
): Promise<Post> => {
  const res = await fetch(`${API_URL}/posts/${id}`, {
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


// DELETE /api/posts/:id   (403 if it's not your post)
export const deletePost = async (token: string | null, id: string): Promise<Post> => {
  const res = await fetch(`${API_URL}/posts/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};
