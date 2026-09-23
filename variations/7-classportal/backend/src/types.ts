// types (what one row from each table looks like)

export interface Teacher {
  id?: string;
  employee_no: string;    // "T-1001"
  full_name: string;
  password_hash?: string;
}

export interface Student {
  id?: string;
  student_no: string;     // "2024-00123"
  full_name: string;
  course: string;
  year_level: number;
  password_hash?: string;
}

export interface Grade {
  id?: string;
  student_id: string;
  subject: string;
  score: number;
  encoded_by?: string;
  created_at?: string;
}
