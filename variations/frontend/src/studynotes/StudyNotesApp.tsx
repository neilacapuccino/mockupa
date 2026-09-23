// StudyNotes app (shown when you pick "1. StudyNotes" on the page)
import { useContext } from "react";
import { NoteContext, NoteProvider } from "./context/NoteContext";
import { AuthForm } from "./components/AuthForm";
import { NoteForm } from "./components/NoteForm";
import { NoteList } from "./components/NoteList";

function MainApp() {
  const context = useContext(NoteContext);
  if (!context) throw new Error("MainApp must be used within NoteProvider");
  const { state, dispatch } = context;

  const handleLogout = () => {
    localStorage.removeItem("notes_token");
    dispatch({ type: "LOGOUT" });
  };

  return (
    <div>
      <h1>StudyNotes</h1>

      {state.token && (
        <p>
          {state.user ? state.user.email : "Logged in"}{" "}
          <button onClick={handleLogout}>Logout</button>
        </p>
      )}

      {state.error && <p>Error: {state.error}</p>}

      {state.token ? (
        <>
          <NoteForm />
          <h2>My notes</h2>
          <NoteList />
        </>
      ) : (
        <AuthForm />
      )}
    </div>
  );
}

export function StudyNotesApp() {
  return (
    <NoteProvider>
      <MainApp />
    </NoteProvider>
  );
}

