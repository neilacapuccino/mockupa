// the cart (frontend only) -> Place order sends everything to POST /api/orders
import { useContext, useState } from "react";
import { CafeContext } from "../context/CafeContext";
import { createOrder } from "../api/cafeService";

export const Cart: React.FC = () => {
  const context = useContext(CafeContext);
  if (!context) throw new Error("Cart must be used within CafeProvider");
  const { state, dispatch } = context;

  const [customerName, setCustomerName] = useState("");

  // DERIVED: calculated from the cart every render (not stored in state)
  // reduce = go through every line and keep adding to "sum"
  const cartTotal = state.cart.reduce(
    (sum, line) => sum + line.menuItem.price * line.quantity,
    0
  );

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // turn the cart into what the backend wants: only ids + quantities (NO prices)
      const newOrder = await createOrder(state.token, {
        customer_name: customerName,
        items: state.cart.map((line) => ({
          menu_item_id: line.menuItem.id,
          quantity: line.quantity,
        })),
      });

      dispatch({ type: "ORDER_PLACED", payload: newOrder });   // also empties the cart
      setCustomerName("");
    } catch (error) {
      // e.g. 400 "Blueberry Muffin is sold out"
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };

  return (
    <div>
      <h2>Cart</h2>

      {state.cart.length === 0 && <p>The cart is empty. Add something from the menu.</p>}

      <ul>
        {state.cart.map((line) => (
          <li key={line.menuItem.id}>
            <button
              onClick={() =>
                dispatch({ type: "CHANGE_QUANTITY", payload: { menuItemId: line.menuItem.id, amount: -1 } })
              }
            >
              -
            </button>{" "}
            {line.quantity}{" "}
            <button
              onClick={() =>
                dispatch({ type: "CHANGE_QUANTITY", payload: { menuItemId: line.menuItem.id, amount: 1 } })
              }
            >
              +
            </button>{" "}
            {line.menuItem.name} = P{line.menuItem.price * line.quantity}
          </li>
        ))}
      </ul>

      <p>
        <strong>Total: P{cartTotal}</strong>
      </p>

      <form onSubmit={handlePlaceOrder}>
        <input
          placeholder="Customer name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          required
        />{" "}
        <button type="submit" disabled={state.cart.length === 0}>
          Place order
        </button>{" "}
        <button type="button" onClick={() => dispatch({ type: "CLEAR_CART" })}>
          Clear cart
        </button>
      </form>
    </div>
  );
};
