// global state (Context + useReducer)
// NEW: the reducer has CONDITIONS inside some cases
import { createContext, useReducer, type Dispatch, type ReactNode } from "react";
import type { State, Action } from "../types";

const initialState: State = {
  user: null,
  token: localStorage.getItem("cafe_token"),
  menu: [],
  cart: [],
  orders: [],
  statusFilter: "all",
  loading: false,
  error: null,
};

const cafeReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_AUTH":
      return { ...state, user: action.payload.user, token: action.payload.token, error: null };

    case "LOGOUT":
      return { ...state, user: null, token: null, menu: [], cart: [], orders: [], error: null };

    case "SET_MENU":
      return { ...state, menu: action.payload };

    case "MENU_ITEM_UPDATED":
      return {
        ...state,
        menu: state.menu.map((item) => (item.id === action.payload.id ? action.payload : item)),
        // CONDITION: if it just became sold out, take it out of the cart too
        cart: action.payload.is_available
          ? state.cart
          : state.cart.filter((line) => line.menuItem.id !== action.payload.id),
        error: null,
      };

    // { } around the case because we make a const inside it
    case "ADD_TO_CART": {
      const alreadyInCart = state.cart.find((line) => line.menuItem.id === action.payload.id);

      // CONDITION: already in the cart -> just add 1 to its quantity
      if (alreadyInCart) {
        return {
          ...state,
          cart: state.cart.map((line) =>
            line.menuItem.id === action.payload.id ? { ...line, quantity: line.quantity + 1 } : line
          ),
        };
      }

      // not in the cart yet -> new line with quantity 1
      return { ...state, cart: [...state.cart, { menuItem: action.payload, quantity: 1 }] };
    }

    case "CHANGE_QUANTITY":
      return {
        ...state,
        cart: state.cart
          .map((line) =>
            line.menuItem.id === action.payload.menuItemId
              ? { ...line, quantity: line.quantity + action.payload.amount }
              : line
          )
          // CONDITION: quantity reached 0 -> remove the line
          .filter((line) => line.quantity > 0),
      };

    case "CLEAR_CART":
      return { ...state, cart: [] };

    case "FETCH_START":
      return { ...state, loading: true, error: null };

    case "SET_ORDERS":
      return { ...state, loading: false, orders: action.payload };

    case "ORDER_PLACED":
      return {
        ...state,
        // 1. the cart is done -> empty it
        cart: [],
        // 2. CONDITION: only show the new order if it matches the filter (new orders are "pending")
        orders:
          state.statusFilter === "all" || state.statusFilter === "pending"
            ? [action.payload, ...state.orders]
            : state.orders,
        error: null,
      };

    case "ORDER_UPDATED":
      return {
        ...state,
        // CONDITION: if the new status doesn't match the filter anymore -> remove it from the list
        orders:
          state.statusFilter === "all" || action.payload.status === state.statusFilter
            ? state.orders.map((order) => (order.id === action.payload.id ? action.payload : order))
            : state.orders.filter((order) => order.id !== action.payload.id),
        error: null,
      };

    case "ORDER_DELETED":
      return {
        ...state,
        orders: state.orders.filter((order) => order.id !== action.payload),
        error: null,
      };

    case "SET_STATUS_FILTER":
      return { ...state, statusFilter: action.payload };

    case "SET_ERROR":
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
};

export const CafeContext = createContext<
  { state: State; dispatch: Dispatch<Action> } | undefined
>(undefined);

export const CafeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cafeReducer, initialState);

  return (
    <CafeContext.Provider value={{ state, dispatch }}>
      {children}
    </CafeContext.Provider>
  );
};
