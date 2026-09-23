// types (what one row from each table looks like)

export interface Department {
  id?: string;
  name: string;
}

export interface Employee {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  department_id?: string;
  position: string;
  employment_type?: string;   // "full_time" | "part_time" | "contract"
  salary: number;
  hire_date: string;          // "2024-01-31"
  is_active?: boolean;
  created_at?: string;
}
