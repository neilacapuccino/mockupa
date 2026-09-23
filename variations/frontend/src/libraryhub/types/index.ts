// types (State + Action copied from the LibraryHub spec)

export interface Book {
  id: string;
  title: string;
  author: string;
  published_year: number;
  is_available: boolean;
  borrowed_by: string | null;
  created_at?: string;
}

export interface State {
  user: { id: string; email: string } | null;
  token: string | null;
  books: Book[];
  filter: string;   // "all" | "available" | "borrowed"
  loading: boolean;
  error: string | null;
}

export type Action =
  | { type: "SET_AUTH"; payload: { user: any; token: string } }
  | { type: "LOGOUT" }
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: Book[] }
  | { type: "ADD_BOOK"; payload: Book }
  | { type: "UPDATE_BOOK"; payload: Book }   // used by borrow AND return
  | { type: "DELETE_BOOK"; payload: string }
  | { type: "SET_FILTER"; payload: string }
  | { type: "SET_ERROR"; payload: string };
