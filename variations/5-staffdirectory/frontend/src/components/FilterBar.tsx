// search + filters + sorting -> all use ONE action: SET_FILTER { name, value }
import { useContext } from "react";
import { DirectoryContext } from "../context/DirectoryContext";

export const FilterBar: React.FC = () => {
  const context = useContext(DirectoryContext);
  if (!context) throw new Error("FilterBar must be used within DirectoryProvider");
  const { state, dispatch } = context;

  // the input's "name" says WHICH filter changed
  const handleFilter = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    dispatch({ type: "SET_FILTER", payload: { name: e.target.name, value: e.target.value } });
  };

  return (
    <p>
      <input
        name="search"
        placeholder="Search name or position..."
        value={state.filters.search}
        onChange={handleFilter}
      />{" "}
      <select name="department_id" value={state.filters.department_id} onChange={handleFilter}>
        <option value="">All departments</option>
        {state.departments.map((department) => (
          <option key={department.id} value={department.id}>
            {department.name}
          </option>
        ))}
      </select>{" "}
      <select name="status" value={state.filters.status} onChange={handleFilter}>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="all">All</option>
      </select>{" "}
      Sort:{" "}
      <select name="sort" value={state.filters.sort} onChange={handleFilter}>
        <option value="last_name">Last name</option>
        <option value="salary">Salary</option>
        <option value="hire_date">Hire date</option>
      </select>{" "}
      <select name="order" value={state.filters.order} onChange={handleFilter}>
        <option value="asc">Ascending</option>
        <option value="desc">Descending</option>
      </select>
    </p>
  );
};
