// global state (Context + useReducer)
import { createContext, useReducer, type Dispatch, type ReactNode } from "react";
import type { State, Action } from "../types";

const initialState: State = {
  user: null,
  token: localStorage.getItem("staff_token"),
  employees: [],
  departments: [],
  filters: {
    search: "",
    department_id: "",
    status: "active",
    sort: "last_name",
    order: "asc",
  },
  page: 1,
  totalPages: 1,
  total: 0,
  editing: null,
  refreshKey: 0,
  loading: false,
  error: null,
};

const directoryReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_AUTH":
      return { ...state, user: action.payload.user, token: action.payload.token, error: null };

    case "LOGOUT":
      return { ...state, user: null, token: null, employees: [], editing: null, error: null };

    case "SET_DEPARTMENTS":
      return { ...state, departments: action.payload };

    case "FETCH_START":
      return { ...state, loading: true, error: null };

    case "FETCH_SUCCESS":
      return {
        ...state,
        loading: false,
        employees: action.payload.data,
        total: action.payload.total,
        totalPages: action.payload.totalPages,
      };

    case "SET_FILTER":
      return {
        ...state,
        // NEW: [name]: value  ->  "change the field whose NAME is in action.payload.name"
        // e.g. { name: "status", value: "all" }  ->  filters.status = "all"
        filters: { ...state.filters, [action.payload.name]: action.payload.value },
        // CONDITION: new filters -> go back to page 1 (page 4 might not exist anymore)
        page: 1,
      };

    case "SET_PAGE":
      return { ...state, page: action.payload };

    case "START_EDIT":
      return { ...state, editing: action.payload };

    case "CANCEL_EDIT":
      return { ...state, editing: null };

    case "UPDATE_EMPLOYEE":
      return {
        ...state,
        employees: state.employees.map((employee) =>
          employee.id === action.payload.id ? action.payload : employee
        ),
        editing: null,   // done editing -> close edit mode
        error: null,
      };

    // NEW: when the SERVER decides what's on each page (filters/sort/pages),
    // it's easier to just ask again than to patch the list yourself
    case "REFRESH":
      return { ...state, refreshKey: state.refreshKey + 1, error: null };

    case "SET_ERROR":
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
};

export const DirectoryContext = createContext<
  { state: State; dispatch: Dispatch<Action> } | undefined
>(undefined);

export const DirectoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(directoryReducer, initialState);

  return (
    <DirectoryContext.Provider value={{ state, dispatch }}>
      {children}
    </DirectoryContext.Provider>
  );
};
