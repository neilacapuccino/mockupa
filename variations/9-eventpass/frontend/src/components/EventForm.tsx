// create an event (logged-in users only)
import { useContext, useState } from "react";
import { EventContext } from "../context/EventContext";
import { createEvent } from "../api/eventService";
import { handleApiError } from "../api/session";

export const EventForm: React.FC = () => {
  const context = useContext(EventContext);
  if (!context) throw new Error("EventForm must be used within EventProvider");
  const { state, dispatch } = context;

  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [startsAt, setStartsAt] = useState("");   // "2026-10-01T14:30"
  const [capacity, setCapacity] = useState("20");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const newEvent = await createEvent(state.token, {
        title,
        venue,
        starts_at: startsAt,
        capacity: Number(capacity),
      });

      dispatch({ type: "ADD_EVENT", payload: newEvent });

      setTitle("");
      setVenue("");
      setStartsAt("");
      setCapacity("20");
    } catch (error) {
      // e.g. 400 "The event must be in the future"  - or an expired token -> auto logout
      handleApiError(error, dispatch);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Create an event</h3>
      <div>
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />{" "}
        <input placeholder="Venue" value={venue} onChange={(e) => setVenue(e.target.value)} required />
      </div>
      <div>
        Starts:{" "}
        <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />{" "}
        Seats:{" "}
        <input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} required />
      </div>
      <button type="submit">Create</button>
    </form>
  );
};
