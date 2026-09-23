// login request
import { API_URL } from "./config";

// POST /api/auth/login  ->  { message, token, expires_in, user }
export const login = async (mobile: string, password: string, remember_me: boolean) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile, password, remember_me }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};
