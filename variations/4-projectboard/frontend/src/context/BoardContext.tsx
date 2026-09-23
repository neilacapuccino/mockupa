// global state (Context + useReducer)
// NEW: NESTED state -> tasks live INSIDE state.selected, and some actions change TWO places at once
import { createContext, useReducer, type Dispatch, type ReactNode } from "react";
import type { State, Action } from "../types";

const initialState: State = {
  user: null,
  token: localStorage.getItem("board_token"),
  projects: [],
  selected: null,
  loading: false,
  error: null,
};

const boardReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_AUTH":
      return { ...state, user: action.payload.user, token: action.payload.token, error: null };

    case "LOGOUT":
      return { ...state, user: null, token: null, projects: [], selected: null, error: null };

    case "FETCH_START":
      return { ...state, loading: true, error: null };

    case "FETCH_PROJECTS_SUCCESS":
      return { ...state, loading: false, projects: action.payload };

    case "ADD_PROJECT":
      return { ...state, projects: [...state.projects, action.payload], error: null };

    case "REMOVE_PROJECT":
      return {
        ...state,
        projects: state.projects.filter((project) => project.id !== action.payload),
        error: null,
      };

    case "OPEN_PROJECT":
      return { ...state, loading: false, selected: action.payload, error: null };

    case "CLOSE_PROJECT":
      return { ...state, selected: null, error: null };

    case "ADD_TASK":
      return {
        ...state,
        // 1. put the task INSIDE the open project
        selected: state.selected
          ? { ...state.selected, tasks: [...state.selected.tasks, action.payload] }
          : null,
        // 2. AND add 1 to that project's task_count in the list
        projects: state.projects.map((project) =>
          project.id === action.payload.project_id
            ? { ...project, task_count: project.task_count + 1 }
            : project
        ),
        error: null,
      };

    case "UPDATE_TASK":
      return {
        ...state,
        selected: state.selected
          ? {
              ...state.selected,
              tasks: state.selected.tasks.map((task) =>
                task.id === action.payload.id ? action.payload : task
              ),
            }
          : null,
        error: null,
      };

    case "REMOVE_TASK":
      return {
        ...state,
        selected: state.selected
          ? {
              ...state.selected,
              tasks: state.selected.tasks.filter((task) => task.id !== action.payload.id),
            }
          : null,
        projects: state.projects.map((project) =>
          project.id === action.payload.project_id
            ? { ...project, task_count: project.task_count - 1 }
            : project
        ),
        error: null,
      };

    case "SET_ERROR":
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
};

export const BoardContext = createContext<
  { state: State; dispatch: Dispatch<Action> } | undefined
>(undefined);

export const BoardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(boardReducer, initialState);

  return (
    <BoardContext.Provider value={{ state, dispatch }}>
      {children}
    </BoardContext.Provider>
  );
};
