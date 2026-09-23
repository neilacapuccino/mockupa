// NEW: everything about SAVING / READING / ENDING the login
import type { Dispatch } from "react";
import type { Action, User } from "../types";

// "remember me" checked   -> localStorage   (stays after you close the browser)
// "remember me" unchecked -> sessionStorage (gone when you close the tab)
export const saveSession = (token: string, user: User, rememberMe: boolean) => {
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem("event_token", token);
  storage.setItem("event_user", JSON.stringify(user));
};

// read the login from whichever storage has it
export const loadToken = () =>
  localStorage.getItem("event_token") || sessionStorage.getItem("event_token");

export const loadUser = (): User | null =>
  JSON.parse(localStorage.getItem("event_user") || sessionStorage.getItem("event_user") || "null");

export const clearSession = () => {
  localStorage.removeItem("event_token");
  localStorage.removeItem("event_user");
  sessionStorage.removeItem("event_token");
  sessionStorage.removeItem("event_user");
};

// a JWT is 3 parts: header.PAYLOAD.signature - the payload is just base64 text,
// so the frontend can READ it (only the server can VERIFY it).
// payload.exp = when it expires, in SECONDS
export const getTokenExpiry = (token: string): Date | null => {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const data = JSON.parse(atob(payload));
    return new Date(data.exp * 1000);   // Date wants MILLISECONDS
  } catch {
    return null;
  }
};

// every catch uses this:
//   expired token -> log out with a message
//   anything else -> show the error
export const handleApiError = (error: unknown, dispatch: Dispatch<Action>) => {
  const message = (error as Error).message;

  // this is the exact message our authMiddleware sends with a 403
  if (message === "Invalid or expired token.") {
    clearSession();
    dispatch({ type: "SESSION_EXPIRED" });
  } else {
    dispatch({ type: "SET_ERROR", payload: message });
  }
};
