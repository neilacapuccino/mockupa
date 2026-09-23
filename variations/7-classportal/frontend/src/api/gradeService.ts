// grade + student requests (every one sends the token)
import { API_URL } from "./config";
import type { Grade, StudentSummary } from "../types";

interface GradeList {
  grades: Grade[];
  average: number | null;
}


// GET /api/grades/mine   (students)
export const fetchMyGrades = async (token: string | null): Promise<GradeList> => {
  const res = await fetch(`${API_URL}/grades/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// GET /api/students   (teachers)
export const fetchStudents = async (token: string | null): Promise<StudentSummary[]> => {
  const res = await fetch(`${API_URL}/students`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// GET /api/grades?student_id=...   (teachers)
export const fetchStudentGrades = async (token: string | null, studentId: string): Promise<GradeList> => {
  const res = await fetch(`${API_URL}/grades?student_id=${studentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// POST /api/grades   (teachers)
export const addGrade = async (
  token: string | null,
  grade: { student_id: string; subject: string; score: number }
) => {
  const res = await fetch(`${API_URL}/grades`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(grade),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// PATCH /api/grades/:id   (teachers)
export const updateGrade = async (token: string | null, id: string, score: number) => {
  const res = await fetch(`${API_URL}/grades/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ score }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// DELETE /api/grades/:id   (teachers)
export const deleteGrade = async (token: string | null, id: string) => {
  const res = await fetch(`${API_URL}/grades/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};
