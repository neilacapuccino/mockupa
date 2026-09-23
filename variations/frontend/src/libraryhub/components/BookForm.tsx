// add-book form -> dispatch ADD_BOOK
import { useContext, useState } from "react";
import { LibraryContext } from "../context/LibraryContext";
import { createBook } from "../api/bookService";

export const BookForm: React.FC = () => {
  const context = useContext(LibraryContext);
  if (!context) throw new Error("BookForm must be used within LibraryProvider");
  const { state, dispatch } = context;

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState("");   // inputs always give a STRING

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // TRAP: the backend uses z.number() -> convert "2018" to 2018 or you get a 400
      const newBook = await createBook(state.token, {
        title,
        author,
        published_year: Number(year),
      });

      dispatch({ type: "ADD_BOOK", payload: newBook });

      setTitle("");
      setAuthor("");
      setYear("");
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Add a book</h3>

      <div>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <input
          placeholder="Author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          required
        />
      </div>
      <div>
        <input
          type="number"
          placeholder="Year (e.g. 2018)"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          required
        />
      </div>

      <button type="submit">Add book</button>
    </form>
  );
};
