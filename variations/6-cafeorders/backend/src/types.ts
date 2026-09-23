// types (what one row from each table looks like)

export interface MenuItem {
  id?: string;
  name: string;
  category: string;       // "coffee" | "tea" | "pastry" | "meal"
  price: number;
  is_available?: boolean;
}

export interface Order {
  id?: string;
  customer_name: string;
  status?: string;        // "pending" | "preparing" | "ready" | "completed" | "cancelled"
  total?: number;
  created_by?: string;
  created_at?: string;
}

// one line of an order in the POST body: { "menu_item_id": "...", "quantity": 2 }
export interface OrderLine {
  menu_item_id: string;
  quantity: number;
}
