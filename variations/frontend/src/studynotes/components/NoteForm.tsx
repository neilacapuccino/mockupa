// create form -> dispatch ADD_NOTE
import { useContext, useState } from "react";
import { NoteContext } from "../context/NoteContext";
import { createNote } from "../api/noteService";

export const NoteForm: React.FC = () => {
  const context = useContext(NoteContext);
  if (!context) throw new Error("NoteForm must be used within NoteProvider");
  const { state, dispatch } = context;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const newNote = await createNote(state.token, { title, content, is_pinned: isPinned });

      dispatch({ type: "ADD_NOTE", payload: newNote });

      // clear the form
      setTitle("");
      setContent("");
      setIsPinned(false);
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>New note</h3>

      <div>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <textarea
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
      </div>
      <div>
        <label>
          {/* checkbox -> use e.target.checked (true/false), NOT e.target.value */}
          <input
            type="checkbox"
            checked={isPinned}
            onChange={(e) => setIsPinned(e.target.checked)}
          />
          Pin this note
        </label>
      </div>

      <button type="submit">Save note</button>
    </form>
  );
};
