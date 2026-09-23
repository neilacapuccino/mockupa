// types (State + Action copied from the StockRoom spec)

export interface Item {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  price: string;   // NUMERIC column -> pg sends it as a STRING ("9.99")
  created_at?: string;
}

export interface State {
  user: { id: string; email: string; role: string } | null;
  token: string | null;
  items: Item[];
  loading: boolean;
  error: string | null;
}

export type Action =
  | { type: "SET_AUTH"; payload: { user: any; token: string } }
  | { type: "LOGOUT" }
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: Item[] }
  | { type: "ADD_ITEM"; payload: Item }
  | { type: "UPDATE_ITEM"; payload: Item }
  | { type: "DELETE_ITEM"; payload: string }
  | { type: "SET_ERROR"; payload: string };
