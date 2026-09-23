// events - guests can SEE them, logged-in users can register / cancel
import { useContext, useEffect } from "react";
import { EventContext } from "../context/EventContext";
import { fetchEvents, registerForEvent, cancelRegistration } from "../api/eventService";
import { handleApiError } from "../api/session";
import type { EventItem } from "../types";

export const EventList: React.FC = () => {
  const context = useContext(EventContext);
  if (!context) throw new Error("EventList must be used within EventProvider");
  const { state, dispatch } = context;

  // loads again after login/logout (token changes) -> is_registered shows up / disappears
  useEffect(() => {
    const loadEvents = async () => {
      dispatch({ type: "FETCH_START" });

      try {
        const data = await fetchEvents(state.token, state.view);
        dispatch({ type: "SET_EVENTS", payload: data });
      } catch (error) {
        handleApiError(error, dispatch);
      }
    };

    loadEvents();
  }, [dispatch, state.token, state.view]);

  const handleRegister = async (id: string) => {
    try {
      const updated = await registerForEvent(state.token, id);
      dispatch({ type: "UPDATE_EVENT", payload: updated });
    } catch (error) {
      // e.g. 409 "Sorry, this event is full"
      handleApiError(error, dispatch);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const updated = await cancelRegistration(state.token, id);
      dispatch({ type: "UPDATE_EVENT", payload: updated });
    } catch (error) {
      handleApiError(error, dispatch);
    }
  };

  // the button depends on SEVERAL conditions
  const renderAction = (event: EventItem) => {
    if (!state.token) return <em>Log in to register</em>;
    if (event.is_registered) {
      return (
        <button onClick={() => handleCancel(event.id)} disabled={event.is_past}>
          Cancel my registration
        </button>
      );
    }
    return (
      <button onClick={() => handleRegister(event.id)} disabled={event.is_past || event.seats_left <= 0}>
        Register
      </button>
    );
  };

  return (
    <div>
      {/* "My events" only makes sense when logged in */}
      {state.token && (
        <p>
          <button onClick={() => dispatch({ type: "SET_VIEW", payload: "all" })} disabled={state.view === "all"}>
            All events
          </button>{" "}
          <button onClick={() => dispatch({ type: "SET_VIEW", payload: "mine" })} disabled={state.view === "mine"}>
            My events
          </button>
        </p>
      )}

      {state.loading && <p>Loading events...</p>}
      {!state.loading && state.events.length === 0 && <p>No events.</p>}

      <ul>
        {state.events.map((event) => (
          <li key={event.id}>
            <strong>{event.title}</strong> - {event.venue} - {new Date(event.starts_at).toLocaleString()}
            <br />
            {event.is_past ? "PAST" : event.seats_left <= 0 ? "FULL" : `${event.seats_left} of ${event.capacity} seats left`}
            {event.is_registered && " - you're registered"}{" "}
            {renderAction(event)}
          </li>
        ))}
      </ul>
    </div>
  );
};
