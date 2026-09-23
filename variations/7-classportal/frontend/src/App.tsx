// ClassPortal app
import { useContext } from "react";
import { ClassContext, ClassProvider } from "./context/ClassContext";
import { LoginForm } from "./components/LoginForm";
import { StudentView } from "./components/StudentView";
import { TeacherView } from "./components/TeacherView";

function MainApp() {
  const context = useContext(ClassContext);
  if (!context) throw new Error("MainApp must be used within ClassProvider");
  const { state, dispatch } = context;

  const handleLogout = () => {
    localStorage.removeItem("class_token");
    localStorage.removeItem("class_user");
    dispatch({ type: "LOGOUT" });
  };

  return (
    <div>
      <h1>ClassPortal</h1>

      {state.token && state.user && (
        <p>
          {state.user.name} ({state.user.type} {state.user.number}){" "}
          <button onClick={handleLogout}>Logout</button>
        </p>
      )}

      {state.error && <p>Error: {state.error}</p>}

      {/* CONDITION: not logged in -> login, teacher -> TeacherView, student -> StudentView */}
      {!state.token || !state.user ? (
        <LoginForm />
      ) : state.user.type === "teacher" ? (
        <TeacherView />
      ) : (
        <StudentView />
      )}
    </div>
  );
}

function App() {
  return (
    <ClassProvider>
      <MainApp />
    </ClassProvider>
  );
}

export default App;
