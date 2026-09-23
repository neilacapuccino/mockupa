// EventPass app
import { useContext } from "react";
import { EventContext, EventProvider } from "./context/EventContext";
import { clearSession } from "./api/session";
import { LoginForm } from "./components/LoginForm";
import { SessionInfo } from "./components/SessionInfo";
import { EventForm } from "./components/EventForm";
import { EventList } from "./components/EventList";

function MainApp() {
  const context = useContext(EventContext);
  if (!context) throw new Error("MainApp must be used within EventProvider");
  const { state, dispatch } = context;

  const handleLogout = () => {
    clearSession();
    dispatch({ type: "LOGOUT" });
  };

  return (
    <div>
      <h1>EventPass</h1>

      {state.token && state.user && (
        <p>
          Hi, {state.user.name} ({state.user.mobile}) <button onClick={handleLogout}>Logout</button>
        </p>
      )}

      {state.notice && <p>{state.notice}</p>}
      {state.error && <p>Error: {state.error}</p>}

      {state.token ? (
        <>
          <SessionInfo />
          <EventForm />
        </>
      ) : (
        <LoginForm />
      )}

      {/* the list is shown to EVERYONE (guests too) */}
      <h2>Events</h2>
      <EventList />
    </div>
  );
}

function App() {
  return (
    <EventProvider>
      <MainApp />
    </EventProvider>
  );
}

export default App;
