// types (what one row from each table looks like)

export interface User {
  id?: string;
  mobile: string;        // "09171234567"
  full_name: string;
  password_hash?: string;
  created_at?: string;
}

export interface Event {
  id?: string;
  title: string;
  venue: string;
  starts_at: string;     // date + time
  capacity: number;
  created_by?: string;
  created_at?: string;
}
