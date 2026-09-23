// filter dropdown -> dispatch SET_FILTER
// GLOBAL DISPATCHING: this component only changes state.filter,
// BookList sees the change and loads the books again
import { useContext } from "react";
import { LibraryContext } from "../context/LibraryContext";

export const FilterBar: React.FC = () => {
  const context = useContext(LibraryContext);
  if (!context) throw new Error("FilterBar must be used within LibraryProvider");
  const { state, dispatch } = context;

  return (
    <p>
      Show:{" "}
      <select
        value={state.filter}
        onChange={(e) => dispatch({ type: "SET_FILTER", payload: e.target.value })}
      >
        <option value="all">All books</option>
        <option value="available">Available only</option>
        <option value="borrowed">Borrowed only</option>
      </select>
    </p>
  );
};
