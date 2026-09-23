// types (what one row from each table looks like)

export interface Project {
  id?: string;
  name: string;
  description?: string;
  deadline?: string;     // "2026-10-15"
  created_by?: string;
  created_at?: string;
}

export interface Task {
  id?: string;
  project_id?: string;
  title: string;
  status?: string;       // "todo" | "doing" | "done"
  priority?: string;     // "low" | "medium" | "high"
  created_at?: string;
}
