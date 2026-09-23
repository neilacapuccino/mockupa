// types (what one row from each table looks like)

export interface User {
  id?: string;
  username: string;
  display_name: string;
  password_hash?: string;
  failed_attempts?: number;
  locked_until?: string | null;
  created_at?: string;
}

export interface Post {
  id?: string;
  user_id?: string;
  title: string;
  body: string;
  created_at?: string;
  updated_at?: string;
}
