// STEP 2 - types (what one row from each table looks like)

export interface User {
  id?: string;
  email: string;
  password_hash?: string;
  created_at?: string;
}

export interface Incident {
  id?: string;
  title: string;
  description: string;
  severity?: string;
  status?: string;
  created_at?: string;
}
