// types (State + Action copied from the EventPass spec)

export interface User {
  id: string;
  name: string;
  mobile: string;
}

export interface EventItem {
  id: string;
  title: string;
  venue: string;
  starts_at: string;
  capacity: number;
  registered_count: number;
  seats_left: number;
  is_past: boolean;
  is_registered: boolean;   // always false for guests
}

export interface State {
  user: User | null;
  token: string | null;
  events: EventItem[];
  view: string;             // "all" | "mine"
  notice: string | null;    // e.g. "Your session expired..."
  loading: boolean;
  error: string | null;
}

export type Action =
  | { type: "LOGIN_SUCCESS"; payload: { user: User; token: string } }
  | { type: "LOGOUT" }
  | { type: "SESSION_EXPIRED" }
  | { type: "FETCH_START" }
  | { type: "SET_EVENTS"; payload: EventItem[] }
  | { type: "ADD_EVENT"; payload: EventItem }
  | { type: "UPDATE_EVENT"; payload: EventItem }
  | { type: "SET_VIEW"; payload: string }
  | { type: "SET_ERROR"; payload: string };
