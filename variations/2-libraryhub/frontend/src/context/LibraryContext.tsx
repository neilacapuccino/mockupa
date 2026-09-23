// global state (Context + useReducer)
import { createContext, useReducer, type Dispatch, type ReactNode } from "react";
import type { State, Action } from "../types";

const initialState: State = {
  user: null,
  token: localStorage.getItem("library_token"),   // each app has its own key (they share one page)
  books: [],
  filter: "all",
  loading: false,
  error: null,
};

const libraryReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_AUTH":
      return { ...state, user: action.payload.user, token: action.payload.token, error: null };

    case "LOGOUT":
      return { ...state, user: null, token: null, books: [], error: null };

    case "FETCH_START":
      return { ...state, loading: true, error: null };

    case "FETCH_SUCCESS":
      return { ...state, loading: false, books: action.payload };

    case "ADD_BOOK":
      return { ...state, books: [...state.books, action.payload], error: null };

    case "UPDATE_BOOK":
      return {
        ...state,
        books: state.books.map((book) =>
          book.id === action.payload.id ? action.payload : book
        ),
        error: null,
      };

    case "DELETE_BOOK":
      return {
        ...state,
        books: state.books.filter((book) => book.id !== action.payload),
        error: null,
      };

    // NEW: the filter lives in global state -> FilterBar changes it, BookList reacts to it
    case "SET_FILTER":
      return { ...state, filter: action.payload };

    case "SET_ERROR":
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
};

export const LibraryContext = createContext<
  { state: State; dispatch: Dispatch<Action> } | undefined
>(undefined);

export const LibraryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(libraryReducer, initialState);

  return (
    <LibraryContext.Provider value={{ state, dispatch }}>
      {children}
    </LibraryContext.Provider>
  );
};
