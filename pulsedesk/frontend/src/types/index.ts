// STEP F1 - types (State + Action are copied from the exam spec)

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  created_at?: string;
}

export interface State {
  user: { id: string; email: string } | null;
  token: string | null;
  incidents: Incident[];
  loading: boolean;
  error: string | null;
}

export type Action =
  | { type: "SET_AUTH"; payload: { user: any; token: string } }
  | { type: "FETCH_SUCCESS"; payload: Incident[] }
  | { type: "CREATE_SUCCESS"; payload: Incident }
  | { type: "UPDATE_SUCCESS"; payload: Incident }
  | { type: "DELETE_SUCCESS"; payload: string }
  | { type: "SET_ERROR"; payload: string }
  // extra (not in the spec):
  | { type: "FETCH_START" }   // turns loading on
  | { type: "LOGOUT" };       // clears user + token

// dropdown options - change them here if the exam uses different values
// (must match the zod enums in backend/src/schemas.ts)
export const SEVERITIES = ["low", "medium", "high", "critical"];
export const STATUSES = ["open", "in_progress", "resolved"];
