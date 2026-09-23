// shows when the login ends + AUTO LOGOUT at that exact moment
import { useContext, useEffect } from "react";
import { EventContext } from "../context/EventContext";
import { clearSession, getTokenExpiry } from "../api/session";

export const SessionInfo: React.FC = () => {
  const context = useContext(EventContext);
  if (!context) throw new Error("SessionInfo must be used within EventProvider");
  const { state, dispatch } = context;

  const expiry = state.token ? getTokenExpiry(state.token) : null;

  // NEW: a timer that fires when the token expires
  useEffect(() => {
    if (!state.token) return;

    const expiresAt = getTokenExpiry(state.token);
    if (!expiresAt) return;

    const msLeft = expiresAt.getTime() - Date.now();

    const timer = setTimeout(() => {
      clearSession();
      dispatch({ type: "SESSION_EXPIRED" });
    }, msLeft);

    // CLEANUP: if you log out (or log in again) first, cancel the old timer
    return () => clearTimeout(timer);
  }, [state.token, dispatch]);

  if (!expiry) return null;

  return <p>Your session ends at {expiry.toLocaleString()}</p>;
};
