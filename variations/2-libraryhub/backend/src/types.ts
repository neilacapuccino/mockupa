// types (what one row from each table looks like)

export interface User {
  id?: string;
  email: string;
  password_hash?: string;
  created_at?: string;
}

export interface Book {
  id?: string;
  title: string;
  author: string;
  published_year: number;
  is_available?: boolean;
  borrowed_by?: string | null;
  created_at?: string;
}
