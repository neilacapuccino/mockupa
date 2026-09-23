// STEP F3 - login form -> dispatch SET_AUTH (same idea as Discord's AuthForm)
import { useContext, useState } from "react";
import { IncidentContext } from "../context/IncidentContext";
import { login } from "../api/authService";
import { Form, Input, Button, ErrorText } from "./styles";

export const AuthForm: React.FC = () => {
  const context = useContext(IncidentContext);
  if (!context) throw new Error("AuthForm must be used within IncidentProvider");
  const { dispatch } = context;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();   // stop the page from reloading
    setError("");

    try {
      const data = await login(email, password);   // { message, token, user }

      localStorage.setItem("token", data.token);    // remember the login after refresh

      dispatch({ type: "SET_AUTH", payload: { user: data.user, token: data.token } });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <h3>Sign In</h3>
      {error && <ErrorText>{error}</ErrorText>}

      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <Button type="submit">Login</Button>

      <p style={{ fontSize: "13px", color: "#888" }}>
        Test account: admin@pulsedesk.com / password123
      </p>
    </Form>
  );
};
