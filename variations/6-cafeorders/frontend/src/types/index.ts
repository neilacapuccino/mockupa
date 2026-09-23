// types (State + Action copied from the CafeOrders spec)

export interface MenuItem {
  id: string;
  name: string;
  category: string;     // "coffee" | "tea" | "pastry" | "meal"
  price: number;
  is_available: boolean;
}

// one line in the cart (only on the frontend, not saved until you place the order)
export interface CartLine {
  menuItem: MenuItem;
  quantity: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  name: string;         // from the JOIN with menu_items
  quantity: number;
  price_each: number;
}

export interface Order {
  id: string;
  customer_name: string;
  status: string;       // "pending" | "preparing" | "ready" | "completed" | "cancelled"
  total: number;
  created_at: string;
  items: OrderItem[];
}

export interface State {
  user: { id: string; email: string } | null;
  token: string | null;
  menu: MenuItem[];
  cart: CartLine[];
  orders: Order[];
  statusFilter: string;   // "all" or one status
  loading: boolean;
  error: string | null;
}

export type Action =
  | { type: "SET_AUTH"; payload: { user: any; token: string } }
  | { type: "LOGOUT" }
  | { type: "SET_MENU"; payload: MenuItem[] }
  | { type: "MENU_ITEM_UPDATED"; payload: MenuItem }
  | { type: "ADD_TO_CART"; payload: MenuItem }
  | { type: "CHANGE_QUANTITY"; payload: { menuItemId: string; amount: number } }   // amount = +1 or -1
  | { type: "CLEAR_CART" }
  | { type: "FETCH_START" }
  | { type: "SET_ORDERS"; payload: Order[] }
  | { type: "ORDER_PLACED"; payload: Order }
  | { type: "ORDER_UPDATED"; payload: Order }
  | { type: "ORDER_DELETED"; payload: string }
  | { type: "SET_STATUS_FILTER"; payload: string }
  | { type: "SET_ERROR"; payload: string };

export const CATEGORIES = ["coffee", "tea", "pastry", "meal"];
export const STATUSES = ["pending", "preparing", "ready", "completed", "cancelled"];

// same rules as the backend - used to decide which buttons to show
// (the backend checks them again, the frontend just hides buttons that would fail)
export const ALLOWED_NEXT: Record<string, string[]> = {
  pending: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed"],
  completed: [],
  cancelled: [],
};
