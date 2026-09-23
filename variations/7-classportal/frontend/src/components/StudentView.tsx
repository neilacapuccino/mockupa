// what a STUDENT sees: only their own grades
import { useContext, useEffect } from "react";
import { ClassContext } from "../context/ClassContext";
import { fetchMyGrades } from "../api/gradeService";

export const StudentView: React.FC = () => {
  const context = useContext(ClassContext);
  if (!context) throw new Error("StudentView must be used within ClassProvider");
  const { state, dispatch } = context;

  useEffect(() => {
    const loadGrades = async () => {
      dispatch({ type: "FETCH_START" });

      try {
        const data = await fetchMyGrades(state.token);
        dispatch({ type: "SET_GRADES", payload: data });
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: (error as Error).message });
      }
    };

    loadGrades();
  }, [dispatch, state.token]);

  if (state.loading) return <p>Loading grades...</p>;

  return (
    <div>
      <h2>My grades</h2>

      {state.grades.length === 0 ? (
        <p>No grades yet.</p>
      ) : (
        <table border={1} cellPadding={6}>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Score</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {state.grades.map((grade) => (
              <tr key={grade.id}>
                <td>{grade.subject}</td>
                <td>{grade.score}</td>
                <td>{grade.remarks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {state.average !== null && (
        <p>
          Average: <strong>{state.average}</strong> -{" "}
          {state.average >= 75 ? "Good standing" : "Needs improvement"}
        </p>
      )}
    </div>
  );
};
