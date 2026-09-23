// login / register form (one form, two modes - same idea as Discord's AuthForm)
import { useContext, useState } from "react";
import { NoteContext } from "../context/NoteContext";
import { login, register } from "../api/authService";

export const AuthForm: React.FC = () => {
  const context = useContext(NoteContext);
  if (!context) throw new Error("AuthForm must be used within NoteProvider");
  const { dispatch } = context;

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (isLogin) {
        const data = await login(email, password);

        localStorage.setItem("notes_token", data.token);

        dispatch({ type: "LOGIN_SUCCESS", payload: { user: data.user, token: data.token } });
      } else {
        // register does NOT log you in - it only creates the account
        await register(email, password);
        alert("Registered! Now log in.");
        setIsLogin(true);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>{isLogin ? "Login" : "Register"}</h3>

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

      <button type="submit">{isLogin ? "Login" : "Create account"}</button>

      <p>
        <button type="button" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Need an account? Register" : "Have an account? Login"}
        </button>
      </p>

      <p>Test accounts: alice@notes.com / bob@notes.com (password123)</p>
    </form>
  );
};
