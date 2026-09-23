// add-item form (only shown to admins) -> dispatch ADD_ITEM
import { useContext, useState } from "react";
import { StockContext } from "../context/StockContext";
import { createItem } from "../api/itemService";

export const ItemForm: React.FC = () => {
  const context = useContext(StockContext);
  if (!context) throw new Error("ItemForm must be used within StockProvider");
  const { state, dispatch } = context;

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState("0");   // inputs give STRINGS
  const [price, setPrice] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // convert the number fields before sending (zod expects numbers)
      const newItem = await createItem(state.token, {
        name,
        sku,
        quantity: Number(quantity),
        price: Number(price),
      });

      dispatch({ type: "ADD_ITEM", payload: newItem });

      setName("");
      setSku("");
      setQuantity("0");
      setPrice("");
    } catch (error) {
      // e.g. 409 "SKU already exists"
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Add an item (admin)</h3>

      <div>
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <input placeholder="SKU (e.g. KEY-001)" value={sku} onChange={(e) => setSku(e.target.value)} required />
      </div>
      <div>
        Quantity:{" "}
        <input type="number" min={0} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      </div>
      <div>
        Price:{" "}
        <input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
      </div>

      <button type="submit">Add item</button>
    </form>
  );
};
