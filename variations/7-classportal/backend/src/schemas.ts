// zod schemas (rules for what the client is allowed to send)
import { z } from "zod";


// ========================================
// AUTH  (NEW: log in with an ID NUMBER, checked with a regex)
// ========================================

// regex = a pattern the text must match
//   ^         start of the text
//   \d{4}     exactly 4 digits
//   -         a dash
//   \d{5}     exactly 5 digits
//   $         end of the text          -> "2024-00123"
export const studentLoginSchema = z.object({
  body: z.object({
    student_no: z.string().regex(/^\d{4}-\d{5}$/, "Student number must look like 2024-00123"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

//   T-  then exactly 4 digits          -> "T-1001"
export const teacherLoginSchema = z.object({
  body: z.object({
    employee_no: z.string().regex(/^T-\d{4}$/, "Employee number must look like T-1001"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});


// ========================================
// GRADES
// ========================================

export const createGradeSchema = z.object({
  body: z.object({
    student_id: z.uuid("student_id must be a valid id"),
    subject: z.string().min(1, "subject is required"),
    score: z.number().int("score must be a whole number").min(0, "score can't be below 0").max(100, "score can't be above 100"),
  }),
});

export const updateGradeSchema = z.object({
  params: z.object({
    id: z.uuid("ID must be a valid id"),
  }),

  body: z.object({
    score: z.number().int("score must be a whole number").min(0, "score can't be below 0").max(100, "score can't be above 100"),
  }),
});

// GET /api/grades?student_id=...   (teachers look at one student)
export const gradeQuerySchema = z.object({
  query: z.object({
    student_id: z.uuid("student_id must be a valid id"),
  }),
});
