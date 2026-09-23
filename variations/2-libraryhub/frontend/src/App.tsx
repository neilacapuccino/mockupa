// LibraryHub app
import { useContext } from "react";
import { LibraryContext, LibraryProvider } from "./context/LibraryContext";
import { AuthForm } from "./components/AuthForm";
import { BookForm } from "./components/BookForm";
import { FilterBar } from "./components/FilterBar";
import { BookList } from "./components/BookList";

function MainApp() {
  const context = useContext(LibraryContext);
  if (!context) throw new Error("MainApp must be used within LibraryProvider");
  const { state, dispatch } = context;

  const handleLogout = () => {
    localStorage.removeItem("library_token");
    dispatch({ type: "LOGOUT" });
  };

  return (
    <div>
      <h1>LibraryHub</h1>

      {state.token && (
        <p>
          {state.user ? state.user.email : "Logged in"}{" "}
          <button onClick={handleLogout}>Logout</button>
        </p>
      )}

      {state.error && <p>Error: {state.error}</p>}

      {state.token ? (
        <>
          <BookForm />
          <h2>Books</h2>
          <FilterBar />
          <BookList />
        </>
      ) : (
        <AuthForm />
      )}
    </div>
  );
}

function App() {
  return (
    <LibraryProvider>
      <MainApp />
    </LibraryProvider>
  );
}

export default App;
