// table of items + stock buttons (everyone) + delete (admin only)
import { useContext, useEffect } from "react";
import { StockContext } from "../context/StockContext";
import { fetchItems, changeStock, deleteItem } from "../api/itemService";

export const ItemList: React.FC = () => {
  const context = useContext(StockContext);
  if (!context) throw new Error("ItemList must be used within StockProvider");
  const { state, dispatch } = context;

  // read the role from global state
  const isAdmin = state.user?.role === "admin";

  useEffect(() => {
    const loadItems = async () => {
      dispatch({ type: "FETCH_START" });

      try {
        const data = await fetchItems(state.token);
        dispatch({ type: "FETCH_SUCCESS", payload: data });
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: (error as Error).message });
      }
    };

    loadItems();
  }, [dispatch, state.token]);

  const handleStock = async (id: string, change: number) => {
    try {
      const updated = await changeStock(state.token, id, change);
      dispatch({ type: "UPDATE_ITEM", payload: updated });
    } catch (error) {
      // e.g. 400 "Not enough stock" when you press -1 at 0
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteItem(state.token, id);
      dispatch({ type: "DELETE_ITEM", payload: id });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };

  if (state.loading) return <p>Loading items...</p>;

  if (state.items.length === 0) return <p>No items yet.</p>;

  return (
    <table border={1} cellPadding={6}>
      <thead>
        <tr>
          <th>Name</th>
          <th>SKU</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {state.items.map((item) => (
          <tr key={item.id}>
            <td>{item.name}</td>
            <td>{item.sku}</td>
            <td>{item.quantity}</td>
            <td>{item.price}</td>
            <td>
              <button onClick={() => handleStock(item.id, 1)}>+1</button>{" "}
              <button onClick={() => handleStock(item.id, -1)}>-1</button>{" "}
              {/* only admins see Delete (the server ALSO checks with requireAdmin) */}
              {isAdmin && <button onClick={() => handleDelete(item.id)}>Delete</button>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
