// ProjectBoard app (shown when you pick "4. ProjectBoard" on the page)
import { useContext } from "react";
import { BoardContext, BoardProvider } from "./context/BoardContext";
import { AuthForm } from "./components/AuthForm";
import { ProjectForm } from "./components/ProjectForm";
import { ProjectList } from "./components/ProjectList";
import { ProjectDetail } from "./components/ProjectDetail";

function MainApp() {
  const context = useContext(BoardContext);
  if (!context) throw new Error("MainApp must be used within BoardProvider");
  const { state, dispatch } = context;

  const handleLogout = () => {
    localStorage.removeItem("board_token");
    dispatch({ type: "LOGOUT" });
  };

  return (
    <div>
      <h1>ProjectBoard</h1>

      {state.token && (
        <p>
          {state.user ? state.user.email : "Logged in"}{" "}
          <button onClick={handleLogout}>Logout</button>
        </p>
      )}

      {state.error && <p>Error: {state.error}</p>}

      {!state.token && <AuthForm />}

      {/* logged in + a project is open -> show that project */}
      {state.token && state.selected && <ProjectDetail />}

      {/* logged in + nothing open -> show the list */}
      {state.token && !state.selected && (
        <>
          <ProjectForm />
          <h2>Projects</h2>
          <ProjectList />
        </>
      )}
    </div>
  );
}

export function ProjectBoardApp() {
  return (
    <BoardProvider>
      <MainApp />
    </BoardProvider>
  );
}
