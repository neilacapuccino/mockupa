// ForumBoard app
import { useContext, useEffect, useState } from "react";
import { ForumContext, ForumProvider } from "./context/ForumContext";
import { fetchMe } from "./api/authService";
import { AuthForm } from "./components/AuthForm";
import { ChangePasswordForm } from "./components/ChangePasswordForm";
import { PostForm } from "./components/PostForm";
import { PostList } from "./components/PostList";

function MainApp() {
  const context = useContext(ForumContext);
  if (!context) throw new Error("MainApp must be used within ForumProvider");
  const { state, dispatch } = context;

  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // NEW: RESTORE THE SESSION
  // after a refresh we still have the token, but not the user -> ask GET /me
  useEffect(() => {
    if (!state.token || state.user) return;

    const restore = async () => {
      try {
        const user = await fetchMe(state.token);
        dispatch({ type: "SESSION_RESTORED", payload: user });
      } catch {
        // expired / fake token -> throw it away
        localStorage.removeItem("forum_token");
        dispatch({ type: "SESSION_FAILED" });
      }
    };

    restore();
  }, [dispatch, state.token, state.user]);

  const handleLogout = () => {
    localStorage.removeItem("forum_token");
    setShowPasswordForm(false);
    dispatch({ type: "LOGOUT" });
  };

  return (
    <div>
      <h1>ForumBoard</h1>

      {state.checkingSession && <p>Checking your session...</p>}

      {state.user && (
        <p>
          Hi, {state.user.display_name} (@{state.user.username}){" "}
          <button onClick={() => setShowPasswordForm(!showPasswordForm)}>Change password</button>{" "}
          <button onClick={handleLogout}>Logout</button>
        </p>
      )}

      {state.message && <p>{state.message}</p>}
      {state.error && <p>Error: {state.error}</p>}

      {/* guests get the login form, logged-in users get the post form */}
      {!state.checkingSession && !state.user && <AuthForm />}
      {state.user && showPasswordForm && <ChangePasswordForm onDone={() => setShowPasswordForm(false)} />}
      {state.user && <PostForm />}

      <h2>Posts</h2>
      <PostList />
    </div>
  );
}

function App() {
  return (
    <ForumProvider>
      <MainApp />
    </ForumProvider>
  );
}

export default App;
