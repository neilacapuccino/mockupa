// types (State + Action copied from the ForumBoard spec)

export interface User {
  id: string;
  username: string;
  display_name: string;
}

export interface Post {
  id: string;
  user_id: string;
  title: string;
  body: string;
  username: string;       // author (from the JOIN)
  display_name: string;
  created_at: string;
  updated_at: string;
}

export interface State {
  user: User | null;
  token: string | null;
  checkingSession: boolean;   // true while we ask GET /me "is this token still good?"
  posts: Post[];
  editing: Post | null;
  message: string | null;     // green-light messages ("Password changed")
  error: string | null;
}

export type Action =
  | { type: "SESSION_RESTORED"; payload: User }
  | { type: "SESSION_FAILED" }
  | { type: "LOGIN_SUCCESS"; payload: { user: User; token: string } }
  | { type: "LOGOUT" }
  | { type: "SET_POSTS"; payload: Post[] }
  | { type: "ADD_POST"; payload: Post }
  | { type: "UPDATE_POST"; payload: Post }
  | { type: "DELETE_POST"; payload: string }
  | { type: "START_EDIT"; payload: Post }
  | { type: "CANCEL_EDIT" }
  | { type: "SET_MESSAGE"; payload: string }
  | { type: "SET_ERROR"; payload: string };
