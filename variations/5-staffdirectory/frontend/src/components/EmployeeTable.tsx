// the big table + pages + edit / deactivate / reactivate
import { useContext, useEffect } from "react";
import { DirectoryContext } from "../context/DirectoryContext";
import { fetchEmployees, deactivateEmployee, reactivateEmployee } from "../api/employeeService";

export const EmployeeTable: React.FC = () => {
  const context = useContext(DirectoryContext);
  if (!context) throw new Error("EmployeeTable must be used within DirectoryProvider");
  const { state, dispatch } = context;

  // loads again when: filters change, page changes, or someone dispatches REFRESH
  useEffect(() => {
    const loadEmployees = async () => {
      dispatch({ type: "FETCH_START" });

      try {
        const result = await fetchEmployees(state.token, state.filters, state.page);
        dispatch({
          type: "FETCH_SUCCESS",
          payload: { data: result.data, total: result.total, totalPages: result.totalPages },
        });
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: (error as Error).message });
      }
    };

    loadEmployees();
  }, [dispatch, state.token, state.filters, state.page, state.refreshKey]);

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateEmployee(state.token, id);
      dispatch({ type: "REFRESH" });   // with the "Active" filter, this person should disappear
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };

  const handleReactivate = async (id: string) => {
    try {
      await reactivateEmployee(state.token, id);
      dispatch({ type: "REFRESH" });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };

  return (
    <div>
      {state.loading && <p>Loading...</p>}

      <table border={1} cellPadding={4}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Department</th>
            <th>Position</th>
            <th>Type</th>
            <th>Salary</th>
            <th>Hired</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {state.employees.map((employee) => (
            <tr key={employee.id}>
              <td>
                {employee.first_name} {employee.last_name}
              </td>
              <td>{employee.email}</td>
              <td>{employee.phone ?? "-"}</td>
              <td>{employee.department_name ?? "-"}</td>
              <td>{employee.position}</td>
              <td>{employee.employment_type}</td>
              <td>{employee.salary.toLocaleString()}</td>
              <td>{employee.hire_date}</td>
              <td>{employee.is_active ? "Active" : "Inactive"}</td>
              <td>
                <button onClick={() => dispatch({ type: "START_EDIT", payload: employee })}>Edit</button>{" "}
                {employee.is_active ? (
                  <button onClick={() => handleDeactivate(employee.id)}>Deactivate</button>
                ) : (
                  <button onClick={() => handleReactivate(employee.id)}>Reactivate</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!state.loading && state.employees.length === 0 && <p>No employees match these filters.</p>}

      {/* pages: CONDITIONS decide when the buttons are disabled */}
      <p>
        <button
          disabled={state.page <= 1}
          onClick={() => dispatch({ type: "SET_PAGE", payload: state.page - 1 })}
        >
          Prev
        </button>{" "}
        Page {state.page} of {state.totalPages} ({state.total} employees){" "}
        <button
          disabled={state.page >= state.totalPages}
          onClick={() => dispatch({ type: "SET_PAGE", payload: state.page + 1 })}
        >
          Next
        </button>
      </p>
    </div>
  );
};
