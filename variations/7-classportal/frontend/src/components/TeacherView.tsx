// what a TEACHER sees: every student + manage the grades of the selected one
import { useContext, useEffect, useState } from "react";
import { ClassContext } from "../context/ClassContext";
import {
  fetchStudents,
  fetchStudentGrades,
  addGrade,
  updateGrade,
  deleteGrade,
} from "../api/gradeService";
import type { Grade } from "../types";

export const TeacherView: React.FC = () => {
  const context = useContext(ClassContext);
  if (!context) throw new Error("TeacherView must be used within ClassProvider");
  const { state, dispatch } = context;

  const [subject, setSubject] = useState("");
  const [score, setScore] = useState("");

  // load everything again (list + the open student's grades)
  // used after every add / edit / delete, so the averages stay correct
  const reload = async () => {
    try {
      const students = await fetchStudents(state.token);
      dispatch({ type: "SET_STUDENTS", payload: students });

      if (state.selectedStudentId) {
        const grades = await fetchStudentGrades(state.token, state.selectedStudentId);
        dispatch({ type: "SET_GRADES", payload: grades });
      }
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };

  // runs on load AND every time the teacher opens another student
  useEffect(() => {
    reload();
  }, [state.token, state.selectedStudentId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.selectedStudentId) return;

    try {
      await addGrade(state.token, {
        student_id: state.selectedStudentId,
        subject,
        score: Number(score),   // input gives a string -> zod wants a number
      });
      setSubject("");
      setScore("");
      await reload();
    } catch (error) {
      // e.g. 409 "This student already has a grade for Networking"
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };

  const handleEdit = async (grade: Grade) => {
    const input = prompt(`New score for ${grade.subject} (0-100):`, String(grade.score));
    if (input === null) return;   // Cancel was pressed

    try {
      await updateGrade(state.token, grade.id, Number(input));
      await reload();
    } catch (error) {
      // e.g. 400 "score can't be above 100"
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGrade(state.token, id);
      await reload();
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };

  const selected = state.students.find((student) => student.id === state.selectedStudentId);

  return (
    <div>
      <h2>Students</h2>
      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>Student No.</th>
            <th>Name</th>
            <th>Course / Year</th>
            <th>Subjects</th>
            <th>Average</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {state.students.map((student) => (
            <tr key={student.id}>
              <td>{student.student_no}</td>
              <td>{student.full_name}</td>
              <td>
                {student.course} - {student.year_level}
              </td>
              <td>{student.subjects}</td>
              <td>{student.average ?? "-"}</td>
              <td>
                <button
                  onClick={() => dispatch({ type: "SELECT_STUDENT", payload: student.id })}
                  disabled={student.id === state.selectedStudentId}
                >
                  Grades
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selected && (
        <div>
          <h3>Grades of {selected.full_name}</h3>

          <ul>
            {state.grades.map((grade) => (
              <li key={grade.id}>
                {grade.subject}: {grade.score} ({grade.remarks}){" "}
                <button onClick={() => handleEdit(grade)}>Edit score</button>{" "}
                <button onClick={() => handleDelete(grade.id)}>Delete</button>
              </li>
            ))}
          </ul>
          {state.grades.length === 0 && <p>No grades yet.</p>}

          <form onSubmit={handleAdd}>
            <input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />{" "}
            <input
              type="number"
              placeholder="Score"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              required
            />{" "}
            <button type="submit">Add grade</button>
          </form>

          <button onClick={() => dispatch({ type: "SELECT_STUDENT", payload: null })}>Close</button>
        </div>
      )}
    </div>
  );
};
