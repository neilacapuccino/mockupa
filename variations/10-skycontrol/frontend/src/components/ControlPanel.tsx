// ControlPanel.tsx - detailed controls for the currently selected flight
import { useContext } from "react";
import { FleetContext } from "../context/FleetContext";

const STATUS_OPTIONS = ["SCHEDULED", "IN_FLIGHT", "LANDED"];

export const ControlPanel: React.FC = () => {
  const context = useContext(FleetContext);
  if (!context) throw new Error("ControlPanel must be used within FleetProvider");
  const { state, dispatch } = context;

  // DERIVED: the selected flight object, found by the id stored in state
  const flight = state.flights.find((f) => f.id === state.selectedFlightId);

  if (!flight) return <p>Click a flight in the table.</p>;

  // the component only DISPATCHES - all the rules are in the reducer
  return (
    <div>
      <h2>Control panel - {flight.id}</h2>
      <p>
        {flight.destination} - {flight.status} - {flight.altitude} ft - fuel {flight.fuelPercent}%
      </p>

      <p>
        Status:{" "}
        <select
          value={flight.status}
          onChange={(e) =>
            dispatch({ type: "UPDATE_STATUS", payload: { flightId: flight.id, status: e.target.value } })
          }
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </p>

      <p>
        Altitude:{" "}
        <button onClick={() => dispatch({ type: "ADJUST_ALTITUDE", payload: { flightId: flight.id, amount: -2000 } })}>
          -2000
        </button>{" "}
        <button onClick={() => dispatch({ type: "ADJUST_ALTITUDE", payload: { flightId: flight.id, amount: 2000 } })}>
          +2000
        </button>
      </p>

      <p>
        Fuel:{" "}
        <button onClick={() => dispatch({ type: "CONSUME_FUEL", payload: { flightId: flight.id, amount: 5 } })}>
          Burn 5%
        </button>{" "}
        <button onClick={() => dispatch({ type: "CONSUME_FUEL", payload: { flightId: flight.id, amount: 20 } })}>
          Burn 20%
        </button>
      </p>
    </div>
  );
};
