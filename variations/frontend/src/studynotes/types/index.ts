// types (State + Action copied from the StudyNotes spec)

export interface Note {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at?: string;
}

export interface State {
  user: { id: string; email: string } | null;
  token: string | null;
  notes: Note[];
  loading: boolean;
  error: string | null;
}

export type Action =
  | { type: "LOGIN_SUCCESS"; payload: { user: any; token: string } }
  | { type: "LOGOUT" }
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: Note[] }
  | { type: "ADD_NOTE"; payload: Note }
  | { type: "EDIT_NOTE"; payload: Note }
  | { type: "REMOVE_NOTE"; payload: string }
  | { type: "SET_ERROR"; payload: string };
