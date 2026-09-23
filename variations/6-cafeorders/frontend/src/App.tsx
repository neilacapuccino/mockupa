// CafeOrders app
import { useContext } from "react";
import { CafeContext, CafeProvider } from "./context/CafeContext";
import { AuthForm } from "./components/AuthForm";
import { MenuPanel } from "./components/MenuPanel";
import { Cart } from "./components/Cart";
import { OrderList } from "./components/OrderList";

function MainApp() {
  const context = useContext(CafeContext);
  if (!context) throw new Error("MainApp must be used within CafeProvider");
  const { state, dispatch } = context;

  const handleLogout = () => {
    localStorage.removeItem("cafe_token");
    dispatch({ type: "LOGOUT" });
  };

  return (
    <div>
      <h1>CafeOrders</h1>

      {state.token && (
        <p>
          {state.user ? state.user.email : "Logged in"}{" "}
          <button onClick={handleLogout}>Logout</button>
        </p>
      )}

      {state.error && <p>Error: {state.error}</p>}

      {state.token ? (
        <>
          <MenuPanel />
          <Cart />
          <OrderList />
        </>
      ) : (
        <AuthForm />
      )}
    </div>
  );
}

function App() {
  return (
    <CafeProvider>
      <MainApp />
    </CafeProvider>
  );
}

export default App;
