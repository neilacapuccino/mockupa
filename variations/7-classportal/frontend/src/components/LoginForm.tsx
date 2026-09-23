// ONE login form, TWO kinds of accounts
// the "I am a..." choice changes the label, the hint AND which route we call
import { useContext, useState } from "react";
import { ClassContext } from "../context/ClassContext";
import { studentLogin, teacherLogin } from "../api/authService";

export const LoginForm: React.FC = () => {
  const context = useContext(ClassContext);
  if (!context) throw new Error("LoginForm must be used within ClassProvider");
  const { dispatch } = context;

  const [accountType, setAccountType] = useState("student");
  const [idNumber, setIdNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // CONDITION: pick the right login route
      const data =
        accountType === "student"
          ? await studentLogin(idNumber, password)
          : await teacherLogin(idNumber, password);

      localStorage.setItem("class_token", data.token);
      localStorage.setItem("class_user", JSON.stringify(data.user));

      dispatch({ type: "LOGIN_SUCCESS", payload: { user: data.user, token: data.token } });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Login</h3>

      <p>
        I am a:{" "}
        <label>
          <input
            type="radio"
            name="accountType"
            value="student"
            checked={accountType === "student"}
            onChange={(e) => setAccountType(e.target.value)}
          />
          Student
        </label>{" "}
        <label>
          <input
            type="radio"
            name="accountType"
            value="teacher"
            checked={accountType === "teacher"}
            onChange={(e) => setAccountType(e.target.value)}
          />
          Teacher
        </label>
      </p>

      {error && <p>Error: {error}</p>}

      <div>
        <input
          placeholder={accountType === "student" ? "Student number (2024-00123)" : "Employee number (T-1001)"}
          value={idNumber}
          onChange={(e) => setIdNumber(e.target.value)}
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

      <button type="submit">Login as {accountType}</button>

      <p>Students: 2024-00123, 2024-00124, 2023-00088 - Teacher: T-1001 (password123)</p>
    </form>
  );
};
