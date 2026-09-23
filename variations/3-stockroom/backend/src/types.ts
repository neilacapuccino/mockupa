// types (what one row from each table looks like)

export interface User {
  id?: string;
  email: string;
  password_hash?: string;
  role?: string;   // "admin" | "staff"
  created_at?: string;
}

export interface Item {
  id?: string;
  name: string;
  sku: string;
  quantity?: number;
  price: number;
  created_at?: string;
}
