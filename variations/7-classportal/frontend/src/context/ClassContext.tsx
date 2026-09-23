// global state (Context + useReducer)
import { createContext, useReducer, type Dispatch, type ReactNode } from "react";
import type { State, Action } from "../types";

const initialState: State = {
  // we save the whole user (we need user.type after a refresh to pick the right dashboard)
  user: JSON.parse(localStorage.getItem("class_user") || "null"),
  token: localStorage.getItem("class_token"),
  students: [],
  selectedStudentId: null,
  grades: [],
  average: null,
  loading: false,
  error: null,
};

const classReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "LOGIN_SUCCESS":
      return { ...state, user: action.payload.user, token: action.payload.token, error: null };

    case "LOGOUT":
      return { ...initialState, user: null, token: null };

    case "FETCH_START":
      return { ...state, loading: true, error: null };

    case "SET_STUDENTS":
      return { ...state, loading: false, students: action.payload };

    case "SELECT_STUDENT":
      // opening another student -> clear the old grades first
      return { ...state, selectedStudentId: action.payload, grades: [], average: null, error: null };

    case "SET_GRADES":
      return {
        ...state,
        loading: false,
        grades: action.payload.grades,
        average: action.payload.average,
      };

    case "SET_ERROR":
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
};

export const ClassContext = createContext<
  { state: State; dispatch: Dispatch<Action> } | undefined
>(undefined);

export const ClassProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(classReducer, initialState);

  return (
    <ClassContext.Provider value={{ state, dispatch }}>
      {children}
    </ClassContext.Provider>
  );
};
