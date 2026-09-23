// types (State + Action copied from the StaffDirectory spec)

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  department_id: string | null;
  department_name: string | null;   // comes from the JOIN
  position: string;
  employment_type: string;
  salary: number;
  hire_date: string;
  is_active: boolean;
}

export interface Department {
  id: string;
  name: string;
}

// all the filter / sort choices, kept together in ONE object
export interface Filters {
  search: string;
  department_id: string;   // "" = all departments
  status: string;          // "active" | "inactive" | "all"
  sort: string;            // "last_name" | "salary" | "hire_date"
  order: string;           // "asc" | "desc"
}

// what GET /api/employees sends back
export interface EmployeePage {
  data: Employee[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface State {
  user: { id: string; email: string } | null;
  token: string | null;
  employees: Employee[];
  departments: Department[];
  filters: Filters;
  page: number;
  totalPages: number;
  total: number;
  editing: Employee | null;   // the employee being edited (null = the form adds a new one)
  refreshKey: number;         // +1 = "please load the list again"
  loading: boolean;
  error: string | null;
}

export type Action =
  | { type: "SET_AUTH"; payload: { user: any; token: string } }
  | { type: "LOGOUT" }
  | { type: "SET_DEPARTMENTS"; payload: Department[] }
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: { data: Employee[]; total: number; totalPages: number } }
  | { type: "SET_FILTER"; payload: { name: string; value: string } }   // ONE action for every filter
  | { type: "SET_PAGE"; payload: number }
  | { type: "START_EDIT"; payload: Employee }
  | { type: "CANCEL_EDIT" }
  | { type: "UPDATE_EMPLOYEE"; payload: Employee }
  | { type: "REFRESH" }
  | { type: "SET_ERROR"; payload: string };
