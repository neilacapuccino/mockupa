// new post OR edit post (when state.editing is set)
import { useContext, useEffect, useState } from "react";
import { ForumContext } from "../context/ForumContext";
import { createPost, updatePost } from "../api/postService";

export const PostForm: React.FC = () => {
  const context = useContext(ForumContext);
  if (!context) throw new Error("PostForm must be used within ForumProvider");
  const { state, dispatch } = context;

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  // clicked "Edit" on a post -> put its text in the form
  useEffect(() => {
    setTitle(state.editing ? state.editing.title : "");
    setBody(state.editing ? state.editing.body : "");
  }, [state.editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (state.editing) {
        const updated = await updatePost(state.token, state.editing.id, { title, body });
        dispatch({ type: "UPDATE_POST", payload: updated });
      } else {
        const newPost = await createPost(state.token, { title, body });
        dispatch({ type: "ADD_POST", payload: newPost });
        setTitle("");
        setBody("");
      }
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>{state.editing ? "Edit post" : "New post"}</h3>
      <div>
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div>
        <textarea placeholder="Write something..." value={body} onChange={(e) => setBody(e.target.value)} required />
      </div>
      <button type="submit">{state.editing ? "Save" : "Post"}</button>{" "}
      {state.editing && (
        <button type="button" onClick={() => dispatch({ type: "CANCEL_EDIT" })}>
          Cancel
        </button>
      )}
    </form>
  );
};
