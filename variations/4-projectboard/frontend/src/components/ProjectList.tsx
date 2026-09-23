// list of projects (GET) + open / delete
import { useContext, useEffect } from "react";
import { BoardContext } from "../context/BoardContext";
import { fetchProjects, fetchProject, deleteProject } from "../api/projectService";

export const ProjectList: React.FC = () => {
  const context = useContext(BoardContext);
  if (!context) throw new Error("ProjectList must be used within BoardProvider");
  const { state, dispatch } = context;

  useEffect(() => {
    const loadProjects = async () => {
      dispatch({ type: "FETCH_START" });

      try {
        const data = await fetchProjects(state.token);
        dispatch({ type: "FETCH_PROJECTS_SUCCESS", payload: data });
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: (error as Error).message });
      }
    };

    loadProjects();
  }, [dispatch, state.token]);

  // load ONE project with its tasks, then open it
  const handleOpen = async (id: string) => {
    try {
      const project = await fetchProject(state.token, id);
      dispatch({ type: "OPEN_PROJECT", payload: project });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProject(state.token, id);
      dispatch({ type: "REMOVE_PROJECT", payload: id });
    } catch (error) {
      // e.g. 409 "Project still has 3 unfinished task(s)"
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };

  if (state.loading) return <p>Loading projects...</p>;

  if (state.projects.length === 0) return <p>No projects yet.</p>;

  return (
    <ul>
      {state.projects.map((project) => (
        <li key={project.id}>
          <strong>{project.name}</strong> - {project.task_count} task(s)
          {project.deadline && <> - due {project.deadline}</>}{" "}
          <button onClick={() => handleOpen(project.id)}>Open</button>{" "}
          <button onClick={() => handleDelete(project.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
};
