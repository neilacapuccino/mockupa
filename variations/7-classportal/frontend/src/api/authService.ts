// login requests - one for students, one for teachers
import { API_URL } from "./config";

// POST /api/auth/student-login  ->  { message, token, user }
export const studentLogin = async (student_no: string, password: string) => {
  const res = await fetch(`${API_URL}/auth/student-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ student_no, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};

// POST /api/auth/teacher-login  ->  { message, token, user }
export const teacherLogin = async (employee_no: string, password: string) => {
  const res = await fetch(`${API_URL}/auth/teacher-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ employee_no, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};
