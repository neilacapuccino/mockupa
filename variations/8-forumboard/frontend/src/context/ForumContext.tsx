// global state (Context + useReducer)
import { createContext, useReducer, type Dispatch, type ReactNode } from "react";
import type { State, Action } from "../types";

const savedToken = localStorage.getItem("forum_token");

const initialState: State = {
  // NEW: we only save the TOKEN. The user comes back from GET /api/auth/me
  user: null,
  token: savedToken,
  checkingSession: savedToken !== null,   // have a token? -> check it first
  posts: [],
  editing: null,
  message: null,
  error: null,
};

const forumReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SESSION_RESTORED":
      return { ...state, user: action.payload, checkingSession: false };

    case "SESSION_FAILED":
      // the saved token is expired or fake -> act like we're logged out
      return {
        ...state,
        user: null,
        token: null,
        checkingSession: false,
        message: "Your session ended. Please log in again.",
      };

    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        message: null,
        error: null,
      };

    case "LOGOUT":
      return { ...state, user: null, token: null, editing: null, message: null, error: null };

    case "SET_POSTS":
      return { ...state, posts: action.payload };

    case "ADD_POST":
      return { ...state, posts: [action.payload, ...state.posts], error: null };

    case "UPDATE_POST":
      return {
        ...state,
        posts: state.posts.map((post) => (post.id === action.payload.id ? action.payload : post)),
        editing: null,
        error: null,
      };

    case "DELETE_POST":
      return {
        ...state,
        posts: state.posts.filter((post) => post.id !== action.payload),
        error: null,
      };

    case "START_EDIT":
      return { ...state, editing: action.payload };

    case "CANCEL_EDIT":
      return { ...state, editing: null };

    case "SET_MESSAGE":
      return { ...state, message: action.payload, error: null };

    case "SET_ERROR":
      return { ...state, error: action.payload, message: null };

    default:
      return state;
  }
};

export const ForumContext = createContext<
  { state: State; dispatch: Dispatch<Action> } | undefined
>(undefined);

export const ForumProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(forumReducer, initialState);

  return (
    <ForumContext.Provider value={{ state, dispatch }}>
      {children}
    </ForumContext.Provider>
  );
};
