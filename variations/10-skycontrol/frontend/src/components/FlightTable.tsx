// FlightTable.tsx - displays filtered flights; highlights the selected flight
import { useContext } from "react";
import { FleetContext } from "../context/FleetContext";

const FILTER_OPTIONS = ["ALL", "SCHEDULED", "IN_FLIGHT", "LANDED"];

export const FlightTable: React.FC = () => {
  const context = useContext(FleetContext);
  if (!context) throw new Error("FlightTable must be used within FleetProvider");
  const { state, dispatch } = context;

  // DERIVED: calculated from state every render (NOT stored in state)
  const visibleFlights =
    state.filterStatus === "ALL"
      ? state.flights
      : state.flights.filter((flight) => flight.status === state.filterStatus);

  return (
    <div>
      <p>
        Show:{" "}
        <select
          value={state.filterStatus}
          onChange={(e) => dispatch({ type: "SET_FILTER", payload: e.target.value })}
        >
          {FILTER_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </p>

      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>Flight</th>
            <th>Destination</th>
            <th>Status</th>
            <th>Altitude</th>
            <th>Fuel</th>
          </tr>
        </thead>
        <tbody>
          {visibleFlights.map((flight) => (
            <tr
              key={flight.id}
              onClick={() => dispatch({ type: "SELECT_FLIGHT", payload: flight.id })}
              style={{
                cursor: "pointer",
                background: flight.id === state.selectedFlightId ? "#ffe08a" : undefined,
              }}
            >
              <td>{flight.id}</td>
              <td>{flight.destination}</td>
              <td>{flight.status}</td>
              <td>{flight.altitude} ft</td>
              <td>{flight.fuelPercent}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      {visibleFlights.length === 0 && <p>No flights with this status.</p>}
    </div>
  );
};
