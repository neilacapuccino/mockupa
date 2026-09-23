// orders + status filter + status buttons (only the allowed next ones) + delete
import { useContext, useEffect } from "react";
import { CafeContext } from "../context/CafeContext";
import { fetchOrders, updateOrderStatus, deleteOrder } from "../api/cafeService";
import { STATUSES, ALLOWED_NEXT } from "../types";

export const OrderList: React.FC = () => {
  const context = useContext(CafeContext);
  if (!context) throw new Error("OrderList must be used within CafeProvider");
  const { state, dispatch } = context;

  // loads again when the filter changes
  useEffect(() => {
    const loadOrders = async () => {
      dispatch({ type: "FETCH_START" });

      try {
        const data = await fetchOrders(state.token, state.statusFilter);
        dispatch({ type: "SET_ORDERS", payload: data });
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: (error as Error).message });
      }
    };

    loadOrders();
  }, [dispatch, state.token, state.statusFilter]);

  const handleStatus = async (id: string, status: string) => {
    try {
      const updated = await updateOrderStatus(state.token, id, status);
      dispatch({ type: "ORDER_UPDATED", payload: updated });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOrder(state.token, id);
      dispatch({ type: "ORDER_DELETED", payload: id });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };

  return (
    <div>
      <h2>Orders</h2>

      <p>
        Show:{" "}
        <select
          value={state.statusFilter}
          onChange={(e) => dispatch({ type: "SET_STATUS_FILTER", payload: e.target.value })}
        >
          <option value="all">all</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </p>

      {state.loading && <p>Loading orders...</p>}

      {!state.loading && state.orders.length === 0 && <p>No orders.</p>}

      <ul>
        {state.orders.map((order) => (
          <li key={order.id}>
            <strong>{order.customer_name}</strong> - {order.status} - P{order.total}
            <ul>
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.quantity} x {item.name} (P{item.price_each} each)
                </li>
              ))}
            </ul>

            {/* CONDITION: only show the statuses this order is allowed to move to */}
            {(ALLOWED_NEXT[order.status] || []).map((next) => (
              <button key={next} onClick={() => handleStatus(order.id, next)}>
                {next}
              </button>
            ))}{" "}
            {order.status === "cancelled" && (
              <button onClick={() => handleDelete(order.id)}>Delete</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
