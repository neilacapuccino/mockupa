// StockRoom app (shown when you pick "3. StockRoom" on the page)
import { useContext } from "react";
import { StockContext, StockProvider } from "./context/StockContext";
import { AuthForm } from "./components/AuthForm";
import { ItemForm } from "./components/ItemForm";
import { ItemList } from "./components/ItemList";

function MainApp() {
  const context = useContext(StockContext);
  if (!context) throw new Error("MainApp must be used within StockProvider");
  const { state, dispatch } = context;

  const handleLogout = () => {
    localStorage.removeItem("stock_token");
    localStorage.removeItem("stock_user");
    dispatch({ type: "LOGOUT" });
  };

  return (
    <div>
      <h1>StockRoom</h1>

      {state.token && (
        <p>
          {state.user ? `${state.user.email} (${state.user.role})` : "Logged in"}{" "}
          <button onClick={handleLogout}>Logout</button>
        </p>
      )}

      {state.error && <p>Error: {state.error}</p>}

      {state.token ? (
        <>
          {/* role-based UI: only admins see the add form */}
          {state.user?.role === "admin" && <ItemForm />}
          <h2>Inventory</h2>
          <ItemList />
        </>
      ) : (
        <AuthForm />
      )}
    </div>
  );
}

export function StockRoomApp() {
  return (
    <StockProvider>
      <MainApp />
    </StockProvider>
  );
}
