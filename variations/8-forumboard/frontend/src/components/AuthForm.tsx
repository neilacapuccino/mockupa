// login / register (register has "confirm password")
import { useContext, useState } from "react";
import { ForumContext } from "../context/ForumContext";
import { login, register } from "../api/authService";

export const AuthForm: React.FC = () => {
  const context = useContext(ForumContext);
  if (!context) throw new Error("AuthForm must be used within ForumProvider");
  const { dispatch } = context;

  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    try {
      if (isLogin) {
        const data = await login(username, password);

        localStorage.setItem("forum_token", data.token);   // only the token is saved

        dispatch({ type: "LOGIN_SUCCESS", payload: { user: data.user, token: data.token } });
      } else {
        // check on the frontend FIRST (quick feedback) - the backend checks again
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          return;
        }

        await register({
          username,
          display_name: displayName,
          password,
          confirm_password: confirmPassword,
        });

        setInfo("Account created! Now log in.");
        setIsLogin(true);
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>{isLogin ? "Login" : "Create an account"}</h3>

      {error && <p>Error: {error}</p>}
      {info && <p>{info}</p>}

      <div>
        <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
      </div>

      {/* only the register form has these */}
      {!isLogin && (
        <div>
          <input
            placeholder="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </div>
      )}

      <div>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {!isLogin && (
        <div>
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
      )}

      <button type="submit">{isLogin ? "Login" : "Register"}</button>{" "}
      <button type="button" onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? "Need an account? Register" : "Have an account? Login"}
      </button>

      <p>Test accounts: juan_dev / maria_codes (password123). Try a wrong password 3 times!</p>
    </form>
  );
};
