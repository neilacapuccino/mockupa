// menu + order requests (every one sends the token)
import { API_URL } from "./config";
import type { MenuItem, Order } from "../types";


// GET /api/menu
export const fetchMenu = async (token: string | null): Promise<MenuItem[]> => {
  const res = await fetch(`${API_URL}/menu`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// PATCH /api/menu/:id/availability   body: { is_available: false }
export const setAvailability = async (
  token: string | null,
  id: string,
  is_available: boolean
): Promise<MenuItem> => {
  const res = await fetch(`${API_URL}/menu/${id}/availability`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ is_available }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// GET /api/orders  (+ ?status=... unless the filter is "all")
export const fetchOrders = async (token: string | null, status: string): Promise<Order[]> => {
  const query = status === "all" ? "" : `?status=${status}`;

  const res = await fetch(`${API_URL}/orders${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// POST /api/orders
// body: { customer_name: "Ana", items: [ { menu_item_id: "...", quantity: 2 } ] }
export const createOrder = async (
  token: string | null,
  order: { customer_name: string; items: { menu_item_id: string; quantity: number }[] }
): Promise<Order> => {
  const res = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(order),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// PATCH /api/orders/:id/status   body: { status: "preparing" }
export const updateOrderStatus = async (
  token: string | null,
  id: string,
  status: string
): Promise<Order> => {
  const res = await fetch(`${API_URL}/orders/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};


// DELETE /api/orders/:id   (only cancelled orders)
export const deleteOrder = async (token: string | null, id: string) => {
  const res = await fetch(`${API_URL}/orders/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.details ? data.details[0].message : data.error);
  }

  return data;
};
