// login form -> dispatch SET_AUTH
import { useContext, useState } from "react";
import { CafeContext } from "../context/CafeContext";
import { login } from "../api/authService";

export const AuthForm: React.FC = () => {
  const context = useContext(CafeContext);
  if (!context) throw new Error("AuthForm must be used within CafeProvider");
  const { dispatch } = context;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const data = await login(email, password);

      localStorage.setItem("cafe_token", data.token);

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

      <p>Test account: cashier@cafe.com (password123)</p>
    </form>
  );
};
