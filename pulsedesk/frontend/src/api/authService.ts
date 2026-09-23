// STEP F3 - login request
import { API_URL } from "./config";

// POST /api/auth/login  ->  returns { message, token, user }
export const login = async (email: string, password: string) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  // fetch does NOT throw on 400/401/500 by itself, so check res.ok
  if (!res.ok) {
    // zod errors come with a "details" list -> show the first message
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};
