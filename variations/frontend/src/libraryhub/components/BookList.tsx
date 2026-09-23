// list (GET with filter) + borrow / return / delete
import { useContext, useEffect } from "react";
import { LibraryContext } from "../context/LibraryContext";
import { fetchBooks, borrowBook, returnBook, deleteBook } from "../api/bookService";

export const BookList: React.FC = () => {
  const context = useContext(LibraryContext);
  if (!context) throw new Error("BookList must be used within LibraryProvider");
  const { state, dispatch } = context;

  // runs again whenever state.filter changes (FilterBar dispatches SET_FILTER)
  useEffect(() => {
    const loadBooks = async () => {
      dispatch({ type: "FETCH_START" });

      try {
        const data = await fetchBooks(state.token, state.filter);
        dispatch({ type: "FETCH_SUCCESS", payload: data });
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: (error as Error).message });
      }
    };

    loadBooks();
  }, [dispatch, state.token, state.filter]);

  // borrow and return both give back the updated book -> same UPDATE_BOOK action
  const handleBorrow = async (id: string) => {
    try {
      const updated = await borrowBook(state.token, id);
      dispatch({ type: "UPDATE_BOOK", payload: updated });
    } catch (error) {
      // e.g. 409 "Book is already borrowed"
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };

  const handleReturn = async (id: string) => {
    try {
      const updated = await returnBook(state.token, id);
      dispatch({ type: "UPDATE_BOOK", payload: updated });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBook(state.token, id);
      dispatch({ type: "DELETE_BOOK", payload: id });
    } catch (error) {
      // e.g. 409 "Can't delete a borrowed book"
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  };

  if (state.loading) return <p>Loading books...</p>;

  if (state.books.length === 0) return <p>No books found.</p>;

  return (
    <ul>
      {state.books.map((book) => (
        <li key={book.id}>
          <strong>{book.title}</strong> by {book.author} ({book.published_year}) -{" "}
          {book.is_available ? "Available" : "Borrowed"}{" "}
          {book.is_available ? (
            <button onClick={() => handleBorrow(book.id)}>Borrow</button>
          ) : (
            <button onClick={() => handleReturn(book.id)}>Return</button>
          )}{" "}
          {/* try deleting a borrowed book -> the server says 409 */}
          <button onClick={() => handleDelete(book.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
};
