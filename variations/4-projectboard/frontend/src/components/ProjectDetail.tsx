// the OPEN project: its tasks grouped by status + add / update / delete tasks
import { useContext, useState } from "react";
import { BoardContext } from "../context/BoardContext";
import { createTask, updateTask, deleteTask } from "../api/projectService";
import { STATUSES, PRIORITIES, type Task } from "../types";

export const ProjectDetail: React.FC = () => {
  const context = useContext(BoardContext);
  if (!context) throw new Error("ProjectDetail must be used within BoardProvider");
  const { state, dispatch } = context;

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");

  const project = state.selected;
  if (!project) return null;   // nothing open

  // DERIVED value: calculated from state, not stored in state
  const doneCount = project.tasks.filter((task) => task.status === "done").length;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const newTask = await createTask(state.token, project.id, { title, priority });
      dispatch({ type: "ADD_TASK", payload: newTask });
      setTitle("");
      setPriority("medium");
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };

  const handleUpdate = async (id: string, changes: Partial<Task>) => {
    try {
      const updated = await updateTask(state.token, id, changes);
      dispatch({ type: "UPDATE_TASK", payload: updated });
    } catch (error) {
      // e.g. 400 "A task can only move forward (todo -> doing -> done)"
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const deleted = await deleteTask(state.token, id);
      dispatch({ type: "REMOVE_TASK", payload: deleted });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };

  return (
    <div>
      <button onClick={() => dispatch({ type: "CLOSE_PROJECT" })}>Back to projects</button>

      <h2>{project.name}</h2>
      {project.description && <p>{project.description}</p>}
      {project.deadline && <p>Deadline: {project.deadline}</p>}
      <p>
        Progress: {doneCount} / {project.tasks.length} done
      </p>

      <form onSubmit={handleAdd}>
        <input placeholder="New task" value={title} onChange={(e) => setTitle(e.target.value)} required />{" "}
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>{" "}
        <button type="submit">Add task</button>
      </form>

      {/* one section per status: todo / doing / done */}
      {STATUSES.map((status) => (
        <div key={status}>
          <h3>{status.toUpperCase()}</h3>
          <ul>
            {project.tasks
              .filter((task) => task.status === status)
              .map((task) => (
                <li key={task.id}>
                  {task.title} [{task.priority}]{" "}
                  {/* try moving a "done" task back to "todo" -> the server says 400 */}
                  <select
                    value={task.status}
                    onChange={(e) => handleUpdate(task.id, { status: e.target.value })}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>{" "}
                  <button onClick={() => handleDelete(task.id)}>Delete</button>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
};
