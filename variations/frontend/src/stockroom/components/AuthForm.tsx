// login form -> dispatch SET_AUTH (also saves the user, because we need the role later)
import { useContext, useState } from "react";
import { StockContext } from "../context/StockContext";
import { login } from "../api/authService";

export const AuthForm: React.FC = () => {
  const context = useContext(StockContext);
  if (!context) throw new Error("AuthForm must be used within StockProvider");
  const { dispatch } = context;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const data = await login(email, password);   // user = { id, email, role }

      localStorage.setItem("stock_token", data.token);
      localStorage.setItem("stock_user", JSON.stringify(data.user));   // object -> string

      dispatch({ type: "SET_AUTH", payload: { user: data.user, token: data.token } });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Login</h3>

      {error && <p>Error: {error}</p>}

      <div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <button type="submit">Login</button>

      <p>Test accounts: admin@stock.com (admin) / staff@stock.com (staff) - password123</p>
    </form>
  );
};
