// list (GET + search) + pin / rename / delete
import { useContext, useEffect, useState } from "react";
import { NoteContext } from "../context/NoteContext";
import { fetchNotes, updateNote, deleteNote } from "../api/noteService";
import type { Note } from "../types";

export const NoteList: React.FC = () => {
  const context = useContext(NoteContext);
  if (!context) throw new Error("NoteList must be used within NoteProvider");
  const { state, dispatch } = context;

  const [search, setSearch] = useState("");

  // load MY notes - runs again every time the search text changes
  useEffect(() => {
    const loadNotes = async () => {
      dispatch({ type: "FETCH_START" });

      try {
        const data = await fetchNotes(state.token, search);
        dispatch({ type: "FETCH_SUCCESS", payload: data });
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: (error as Error).message });
      }
    };

    loadNotes();
  }, [dispatch, state.token, search]);

  // PUT - used by Pin/Unpin and Rename
  const handleUpdate = async (id: string, changes: Partial<Note>) => {
    try {
      const updated = await updateNote(state.token, id, changes);
      dispatch({ type: "EDIT_NOTE", payload: updated });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };

  const handleRename = (note: Note) => {
    // prompt() = simple popup that returns what the user typed (or null if cancelled)
    const newTitle = prompt("New title:", note.title);
    if (newTitle) {
      handleUpdate(note.id, { title: newTitle });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNote(state.token, id);
      dispatch({ type: "REMOVE_NOTE", payload: id });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };

  return (
    <div>
      {/* the search box is always shown, so it doesn't lose focus while loading */}
      <input
        placeholder="Search by title..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {state.loading && <p>Loading...</p>}

      {!state.loading && state.notes.length === 0 && <p>No notes found.</p>}

      <ul>
        {state.notes.map((note) => (
          <li key={note.id}>
            <h4>
              {note.is_pinned ? "[PINNED] " : ""}
              {note.title}
            </h4>
            <p>{note.content}</p>

            <button onClick={() => handleUpdate(note.id, { is_pinned: !note.is_pinned })}>
              {note.is_pinned ? "Unpin" : "Pin"}
            </button>
            <button onClick={() => handleRename(note)}>Rename</button>
            <button onClick={() => handleDelete(note.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};
