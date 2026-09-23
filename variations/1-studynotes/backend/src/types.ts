// types (what one row from each table looks like)

export interface User {
  id?: string;
  email: string;
  password_hash?: string;
  created_at?: string;
}

export interface Note {
  id?: string;
  user_id?: string;
  title: string;
  content: string;
  is_pinned?: boolean;
  created_at?: string;
}
