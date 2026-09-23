// global state (Context + useReducer)
import { createContext, useReducer, type Dispatch, type ReactNode } from "react";
import type { State, Action } from "../types";
import { loadToken, loadUser } from "../api/session";

const initialState: State = {
  user: loadUser(),     // from localStorage OR sessionStorage
  token: loadToken(),
  events: [],
  view: "all",
  notice: null,
  loading: false,
  error: null,
};

const eventReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        notice: null,
        error: null,
      };

    case "LOGOUT":
      return { ...state, user: null, token: null, view: "all", notice: null, error: null };

    case "SESSION_EXPIRED":
      return {
        ...state,
        user: null,
        token: null,
        view: "all",
        notice: "Your session expired. Please log in again.",
      };

    case "FETCH_START":
      return { ...state, loading: true, error: null };

    case "SET_EVENTS":
      return { ...state, loading: false, events: action.payload };

    case "ADD_EVENT":
      return { ...state, events: [...state.events, action.payload], error: null };

    case "UPDATE_EVENT":
      return {
        ...state,
        events: state.events.map((event) => (event.id === action.payload.id ? action.payload : event)),
        error: null,
      };

    case "SET_VIEW":
      return { ...state, view: action.payload };

    case "SET_ERROR":
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
};

export const EventContext = createContext<
  { state: State; dispatch: Dispatch<Action> } | undefined
>(undefined);

export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(eventReducer, initialState);

  return (
    <EventContext.Provider value={{ state, dispatch }}>
      {children}
    </EventContext.Provider>
  );
};
