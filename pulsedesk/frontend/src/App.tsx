// STEP F7 - put everything together (same idea as Discord's new App.tsx)
import { useContext } from "react";
import { IncidentContext, IncidentProvider } from "./context/IncidentContext";
import { AuthForm } from "./components/AuthForm";
import { IncidentForm } from "./components/IncidentForm";
import { IncidentList } from "./components/IncidentList";
import { Container, Row, LogoutButton, ErrorText } from "./components/styles";

// MainApp is separate from App because a component can't
// useContext a provider that it renders itself
function MainApp() {
  const context = useContext(IncidentContext);
  if (!context) throw new Error("MainApp must be used within IncidentProvider");
  const { state, dispatch } = context;

  const handleLogout = () => {
    localStorage.removeItem("token");
    dispatch({ type: "LOGOUT" });
  };

  return (
    <Container>
      <Row>
        <h1>PulseDesk</h1>

        {state.token && (
          <Row>
            {state.user && <span>{state.user.email}</span>}
            <LogoutButton onClick={handleLogout}>Sign Out</LogoutButton>
          </Row>
        )}
      </Row>

      {/* any component can dispatch SET_ERROR -> it shows up here */}
      {state.error && <ErrorText>{state.error}</ErrorText>}

      {/* logged in -> incidents,  logged out -> login form */}
      {state.token ? (
        <>
          <IncidentForm />
          <h2>Incidents</h2>
          <IncidentList />
        </>
      ) : (
        <AuthForm />
      )}
    </Container>
  );
}

function App() {
  return (
    <IncidentProvider>
      <MainApp />
    </IncidentProvider>
  );
}

export default App;
