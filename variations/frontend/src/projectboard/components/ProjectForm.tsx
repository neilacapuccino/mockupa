// create-project form -> dispatch ADD_PROJECT
import { useContext, useState } from "react";
import { BoardContext } from "../context/BoardContext";
import { createProject } from "../api/projectService";

export const ProjectForm: React.FC = () => {
  const context = useContext(BoardContext);
  if (!context) throw new Error("ProjectForm must be used within BoardProvider");
  const { state, dispatch } = context;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");   // <input type="date"> gives "2026-10-15"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const newProject = await createProject(state.token, {
        name,
        // empty -> undefined, so it isn't sent at all (the fields are optional)
        description: description || undefined,
        deadline: deadline || undefined,
      });

      dispatch({ type: "ADD_PROJECT", payload: newProject });

      setName("");
      setDescription("");
      setDeadline("");
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>New project</h3>

      <div>
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <input
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        Deadline (optional):{" "}
        <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      </div>

      <button type="submit">Create project</button>
    </form>
  );
};
