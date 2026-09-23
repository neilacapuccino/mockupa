// employee + department requests (every one sends the token)
import { API_URL } from "./config";
import type { Department, Employee, EmployeePage, Filters } from "../types";

// what the form sends to POST / PUT
export interface EmployeeInput {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  department_id?: string;
  position: string;
  employment_type: string;
  salary: number;
  hire_date: string;
}


// GET /api/departments
export const fetchDepartments = async (token: string | null): Promise<Department[]> => {
  const res = await fetch(`${API_URL}/departments`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// GET /api/employees?search=...&status=...&page=...
export const fetchEmployees = async (
  token: string | null,
  filters: Filters,
  page: number
): Promise<EmployeePage> => {
  // NEW: URLSearchParams builds "search=ana&status=active&page=2" for you
  const params = new URLSearchParams();

  // only send search / department when they have a value
  if (filters.search) params.append("search", filters.search);
  if (filters.department_id) params.append("department_id", filters.department_id);

  params.append("status", filters.status);
  params.append("sort", filters.sort);
  params.append("order", filters.order);
  params.append("page", String(page));
  params.append("limit", "5");

  const res = await fetch(`${API_URL}/employees?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// POST /api/employees
export const createEmployee = async (token: string | null, employee: EmployeeInput): Promise<Employee> => {
  const res = await fetch(`${API_URL}/employees`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(employee),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// PUT /api/employees/:id
export const updateEmployee = async (
  token: string | null,
  id: string,
  changes: Partial<EmployeeInput>
): Promise<Employee> => {
  const res = await fetch(`${API_URL}/employees/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(changes),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// DELETE /api/employees/:id   (soft delete -> is_active = false)
export const deactivateEmployee = async (token: string | null, id: string): Promise<Employee> => {
  const res = await fetch(`${API_URL}/employees/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// PATCH /api/employees/:id/reactivate
export const reactivateEmployee = async (token: string | null, id: string): Promise<Employee> => {
  const res = await fetch(`${API_URL}/employees/${id}/reactivate`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};
