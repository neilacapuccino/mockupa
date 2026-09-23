// ONE form for both ADD and EDIT
// NEW: many fields -> ONE state object + ONE handleChange (uses the input's "name")
import { useContext, useEffect, useState } from "react";
import { DirectoryContext } from "../context/DirectoryContext";
import { createEmployee, updateEmployee } from "../api/employeeService";

// every input value is a STRING (even salary) - we convert when we send
const emptyForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  department_id: "",
  position: "",
  employment_type: "full_time",
  salary: "",
  hire_date: "",
};

export const EmployeeForm: React.FC = () => {
  const context = useContext(DirectoryContext);
  if (!context) throw new Error("EmployeeForm must be used within DirectoryProvider");
  const { state, dispatch } = context;

  const [form, setForm] = useState(emptyForm);

  // when you click "Edit" on a row -> copy that employee into the form
  // when editing ends -> empty the form again
  useEffect(() => {
    if (state.editing) {
      setForm({
        first_name: state.editing.first_name,
        last_name: state.editing.last_name,
        email: state.editing.email,
        phone: state.editing.phone ?? "",
        department_id: state.editing.department_id ?? "",
        position: state.editing.position,
        employment_type: state.editing.employment_type,
        salary: String(state.editing.salary),
        hire_date: state.editing.hire_date,
      });
    } else {
      setForm(emptyForm);
    }
  }, [state.editing]);

  // ONE handler for ALL inputs:
  // <input name="position" ...>  ->  form.position = what you typed
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // turn the strings into what the backend (zod) expects
    const body = {
      ...form,
      salary: Number(form.salary),                    // "50000" -> 50000
      phone: form.phone || undefined,                 // ""      -> not sent
      department_id: form.department_id || undefined, // ""      -> not sent
    };

    try {
      if (state.editing) {
        const updated = await updateEmployee(state.token, state.editing.id, body);
        dispatch({ type: "UPDATE_EMPLOYEE", payload: updated });
      } else {
        await createEmployee(state.token, body);
        // the new person might belong on another page -> just reload the list
        dispatch({ type: "REFRESH" });
        setForm(emptyForm);
      }
    } catch (error) {
      // e.g. 409 "Email already exists"
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>{state.editing ? `Edit ${state.editing.first_name}` : "Add employee"}</h3>

      <div>
        <input name="first_name" placeholder="First name" value={form.first_name} onChange={handleChange} required />{" "}
        <input name="last_name" placeholder="Last name" value={form.last_name} onChange={handleChange} required />
      </div>
      <div>
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />{" "}
        <input name="phone" placeholder="Phone (optional)" value={form.phone} onChange={handleChange} />
      </div>
      <div>
        <select name="department_id" value={form.department_id} onChange={handleChange}>
          <option value="">-- no department --</option>
          {state.departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>{" "}
        <input name="position" placeholder="Position" value={form.position} onChange={handleChange} required />
      </div>
      <div>
        <select name="employment_type" value={form.employment_type} onChange={handleChange}>
          <option value="full_time">Full time</option>
          <option value="part_time">Part time</option>
          <option value="contract">Contract</option>
        </select>{" "}
        Salary: <input name="salary" type="number" min={0} value={form.salary} onChange={handleChange} required />{" "}
        Hired: <input name="hire_date" type="date" value={form.hire_date} onChange={handleChange} required />
      </div>

      <button type="submit">{state.editing ? "Save changes" : "Add employee"}</button>{" "}
      {state.editing && (
        <button type="button" onClick={() => dispatch({ type: "CANCEL_EDIT" })}>
          Cancel
        </button>
      )}
    </form>
  );
};
