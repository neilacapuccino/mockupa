// all posts - PUBLIC (guests can read too). Edit/Delete only on MY posts.
import { useContext, useEffect } from "react";
import { ForumContext } from "../context/ForumContext";
import { fetchPosts, deletePost } from "../api/postService";

export const PostList: React.FC = () => {
  const context = useContext(ForumContext);
  if (!context) throw new Error("PostList must be used within ForumProvider");
  const { state, dispatch } = context;

  // no token needed -> runs even when you're logged out
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await fetchPosts();
        dispatch({ type: "SET_POSTS", payload: data });
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: (error as Error).message });
      }
    };

    loadPosts();
  }, [dispatch]);

  const handleDelete = async (id: string) => {
    try {
      await deletePost(state.token, id);
      dispatch({ type: "DELETE_POST", payload: id });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };

  if (state.posts.length === 0) return <p>No posts yet.</p>;

  return (
    <ul>
      {state.posts.map((post) => {
        // CONDITION: is this MY post?
        const isMine = state.user !== null && post.user_id === state.user.id;

        return (
          <li key={post.id}>
            <h4>{post.title}</h4>
            <p>{post.body}</p>
            <small>
              by {post.display_name} (@{post.username}) - {new Date(post.created_at).toLocaleString()}
            </small>{" "}
            {isMine && (
              <>
                <button onClick={() => dispatch({ type: "START_EDIT", payload: post })}>Edit</button>{" "}
                <button onClick={() => handleDelete(post.id)}>Delete</button>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
};
