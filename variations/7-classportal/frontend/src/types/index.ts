// types (State + Action copied from the ClassPortal spec)

export interface User {
  id: string;
  name: string;
  type: string;     // "student" | "teacher"
  number: string;   // "2024-00123" or "T-1001"
}

export interface Grade {
  id: string;
  subject: string;
  score: number;
  remarks: string;  // "Passed" | "Failed" (made by the SQL CASE WHEN)
}

export interface StudentSummary {
  id: string;
  student_no: string;
  full_name: string;
  course: string;
  year_level: number;
  subjects: number;
  average: number | null;
}

export interface State {
  user: User | null;
  token: string | null;
  students: StudentSummary[];         // teacher view
  selectedStudentId: string | null;   // teacher view: whose grades are open
  grades: Grade[];
  average: number | null;
  loading: boolean;
  error: string | null;
}

export type Action =
  | { type: "LOGIN_SUCCESS"; payload: { user: User; token: string } }
  | { type: "LOGOUT" }
  | { type: "FETCH_START" }
  | { type: "SET_STUDENTS"; payload: StudentSummary[] }
  | { type: "SELECT_STUDENT"; payload: string | null }
  | { type: "SET_GRADES"; payload: { grades: Grade[]; average: number | null } }
  | { type: "SET_ERROR"; payload: string };
