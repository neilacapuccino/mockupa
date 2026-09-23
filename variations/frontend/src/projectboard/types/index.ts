// types (State + Action copied from the ProjectBoard spec)

export interface Task {
  id: string;
  project_id: string;
  title: string;
  status: string;     // "todo" | "doing" | "done"
  priority: string;   // "low" | "medium" | "high"
}

// what the LIST shows (GET /api/projects)
export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  deadline: string | null;
  task_count: number;
}

// what ONE opened project looks like (GET /api/projects/:id)
export interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  deadline: string | null;
  tasks: Task[];
}

export interface State {
  user: { id: string; email: string } | null;
  token: string | null;
  projects: ProjectSummary[];
  selected: ProjectDetail | null;   // the project that is open right now (null = none)
  loading: boolean;
  error: string | null;
}

export type Action =
  | { type: "SET_AUTH"; payload: { user: any; token: string } }
  | { type: "LOGOUT" }
  | { type: "FETCH_START" }
  | { type: "FETCH_PROJECTS_SUCCESS"; payload: ProjectSummary[] }
  | { type: "ADD_PROJECT"; payload: ProjectSummary }
  | { type: "REMOVE_PROJECT"; payload: string }
  | { type: "OPEN_PROJECT"; payload: ProjectDetail }
  | { type: "CLOSE_PROJECT" }
  | { type: "ADD_TASK"; payload: Task }
  | { type: "UPDATE_TASK"; payload: Task }
  | { type: "REMOVE_TASK"; payload: Task }   // the whole deleted task (we need its project_id)
  | { type: "SET_ERROR"; payload: string };

export const STATUSES = ["todo", "doing", "done"];
export const PRIORITIES = ["low", "medium", "high"];
