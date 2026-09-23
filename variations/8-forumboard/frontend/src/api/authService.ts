// auth requests: me, login, register, change password
import { API_URL } from "./config";
import type { User } from "../types";


// GET /api/auth/me   -> who does this token belong to?
export const fetchMe = async (token: string | null): Promise<User> => {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// POST /api/auth/login  ->  { message, token, user }
export const login = async (username: string, password: string) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    // 401 "Invalid username or password (2 tries left)"  or  423 "Account locked..."
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// POST /api/auth/register  ->  { message, user }
export const register = async (account: {
  username: string;
  display_name: string;
  password: string;
  confirm_password: string;
}) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(account),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// PATCH /api/auth/password  ->  { message }
export const changePassword = async (
  token: string | null,
  current_password: string,
  new_password: string
) => {
  const res = await fetch(`${API_URL}/auth/password`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ current_password, new_password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};
