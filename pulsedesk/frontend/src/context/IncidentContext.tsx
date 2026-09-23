// STEP F2 - global state (Context + useReducer), same shape as Discord's PieContext
import { createContext, useReducer, type Dispatch, type ReactNode } from "react";
import type { State, Action } from "../types";

const initialState: State = {
  user: null,
  token: localStorage.getItem("token"),   // still logged in after a page refresh
  incidents: [],
  loading: false,
  error: null,
};

const incidentReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_AUTH":
      return { ...state, user: action.payload.user, token: action.payload.token, error: null };

    case "LOGOUT":
      return { ...state, user: null, token: null, incidents: [], error: null };

    case "FETCH_START":
      return { ...state, loading: true, error: null };

    case "FETCH_SUCCESS":
      return { ...state, loading: false, incidents: action.payload };

    case "CREATE_SUCCESS":
      // new incident goes on top of the list
      return { ...state, incidents: [action.payload, ...state.incidents], error: null };

    case "UPDATE_SUCCESS":
      // replace the one with the same id, keep the others
      return {
        ...state,
        incidents: state.incidents.map((incident) =>
          incident.id === action.payload.id ? action.payload : incident
        ),
        error: null,
      };

    case "DELETE_SUCCESS":
      // keep every incident EXCEPT the deleted id
      return {
        ...state,
        incidents: state.incidents.filter((incident) => incident.id !== action.payload),
        error: null,
      };

    case "SET_ERROR":
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
};

export const IncidentContext = createContext<
  { state: State; dispatch: Dispatch<Action> } | undefined
>(undefined);

export const IncidentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(incidentReducer, initialState);

  return (
    <IncidentContext.Provider value={{ state, dispatch }}>
      {children}
    </IncidentContext.Provider>
  );
};
