// StaffDirectory app
import { useContext, useEffect } from "react";
import { DirectoryContext, DirectoryProvider } from "./context/DirectoryContext";
import { fetchDepartments } from "./api/employeeService";
import { AuthForm } from "./components/AuthForm";
import { EmployeeForm } from "./components/EmployeeForm";
import { FilterBar } from "./components/FilterBar";
import { EmployeeTable } from "./components/EmployeeTable";

function MainApp() {
  const context = useContext(DirectoryContext);
  if (!context) throw new Error("MainApp must be used within DirectoryProvider");
  const { state, dispatch } = context;

  // load the departments ONCE after login (the form AND the filters both need them)
  useEffect(() => {
    if (!state.token) return;

    const loadDepartments = async () => {
      try {
        const data = await fetchDepartments(state.token);
        dispatch({ type: "SET_DEPARTMENTS", payload: data });
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: (error as Error).message });
      }
    };

    loadDepartments();
  }, [dispatch, state.token]);

  const handleLogout = () => {
    localStorage.removeItem("staff_token");
    dispatch({ type: "LOGOUT" });
  };

  return (
    <div>
      <h1>StaffDirectory</h1>

      {state.token && (
        <p>
          {state.user ? state.user.email : "Logged in"}{" "}
          <button onClick={handleLogout}>Logout</button>
        </p>
      )}

      {state.error && <p>Error: {state.error}</p>}

      {state.token ? (
        <>
          <EmployeeForm />
          <h2>Employees</h2>
          <FilterBar />
          <EmployeeTable />
        </>
      ) : (
        <AuthForm />
      )}
    </div>
  );
}

function App() {
  return (
    <DirectoryProvider>
      <MainApp />
    </DirectoryProvider>
  );
}

export default App;
