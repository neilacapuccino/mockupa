// login with a MOBILE NUMBER + "remember me" checkbox
import { useContext, useState } from "react";
import { EventContext } from "../context/EventContext";
import { login } from "../api/authService";
import { saveSession } from "../api/session";

export const LoginForm: React.FC = () => {
  const context = useContext(EventContext);
  if (!context) throw new Error("LoginForm must be used within EventProvider");
  const { dispatch } = context;

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const data = await login(mobile, password, rememberMe);

      // WHERE we save depends on the checkbox (see api/session.ts)
      saveSession(data.token, data.user, rememberMe);

      dispatch({ type: "LOGIN_SUCCESS", payload: { user: data.user, token: data.token } });
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
          type="tel"
          placeholder="Mobile number (09171234567)"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
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
      <div>
        <label>
          <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
          Remember me (7 days instead of 15 minutes)
        </label>
      </div>

      <button type="submit">Login</button>

      <p>Test accounts: 09171234567 (Ana) / 09181234567 (Ben) - password123</p>
    </form>
  );
};
