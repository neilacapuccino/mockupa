// global state (Context + useReducer)
import { createContext, useReducer, type Dispatch, type ReactNode } from "react";
import type { State, Action } from "../types";

const initialState: State = {
  // NEW: we also save the USER (we need the role after a page refresh).
  // localStorage only stores strings -> JSON.stringify when saving, JSON.parse when reading
  user: JSON.parse(localStorage.getItem("stock_user") || "null"),
  token: localStorage.getItem("stock_token"),
  items: [],
  loading: false,
  error: null,
};

const stockReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_AUTH":
      return { ...state, user: action.payload.user, token: action.payload.token, error: null };

    case "LOGOUT":
      return { ...state, user: null, token: null, items: [], error: null };

    case "FETCH_START":
      return { ...state, loading: true, error: null };

    case "FETCH_SUCCESS":
      return { ...state, loading: false, items: action.payload };

    case "ADD_ITEM":
      return { ...state, items: [...state.items, action.payload], error: null };

    case "UPDATE_ITEM":
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id ? action.payload : item
        ),
        error: null,
      };

    case "DELETE_ITEM":
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload),
        error: null,
      };

    case "SET_ERROR":
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
};

export const StockContext = createContext<
  { state: State; dispatch: Dispatch<Action> } | undefined
>(undefined);

export const StockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(stockReducer, initialState);

  return (
    <StockContext.Provider value={{ state, dispatch }}>
      {children}
    </StockContext.Provider>
  );
};
