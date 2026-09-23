// the menu, grouped by category -> Add to cart / Sold out toggle
import { useContext, useEffect } from "react";
import { CafeContext } from "../context/CafeContext";
import { fetchMenu, setAvailability } from "../api/cafeService";
import { CATEGORIES } from "../types";

export const MenuPanel: React.FC = () => {
  const context = useContext(CafeContext);
  if (!context) throw new Error("MenuPanel must be used within CafeProvider");
  const { state, dispatch } = context;

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const data = await fetchMenu(state.token);
        dispatch({ type: "SET_MENU", payload: data });
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: (error as Error).message });
      }
    };

    loadMenu();
  }, [dispatch, state.token]);

  const handleToggle = async (id: string, is_available: boolean) => {
    try {
      const updated = await setAvailability(state.token, id, is_available);
      dispatch({ type: "MENU_ITEM_UPDATED", payload: updated });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };

  return (
    <div>
      <h2>Menu</h2>

      {/* one list per category */}
      {CATEGORIES.map((category) => (
        <div key={category}>
          <h4>{category.toUpperCase()}</h4>
          <ul>
            {state.menu
              .filter((item) => item.category === category)
              .map((item) => (
                <li key={item.id}>
                  {item.name} - P{item.price} {!item.is_available && <em>(sold out)</em>}{" "}
                  <button
                    disabled={!item.is_available}
                    onClick={() => dispatch({ type: "ADD_TO_CART", payload: item })}
                  >
                    Add
                  </button>{" "}
                  <button onClick={() => handleToggle(item.id, !item.is_available)}>
                    {item.is_available ? "Mark sold out" : "Back in stock"}
                  </button>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
};
