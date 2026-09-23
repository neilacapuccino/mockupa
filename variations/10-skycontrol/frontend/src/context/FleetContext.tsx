// FleetContext.tsx - createContext, the reducer function, and FleetProvider
import { createContext, useReducer, type Dispatch, type ReactNode } from "react";


// ========================================
// TYPES  (from the spec's "Initial State Shape")
// ========================================

export interface Flight {
  id: string;
  destination: string;
  // "SCHEDULED" | "IN_FLIGHT" | "LANDED"
  status: string;
  altitude: number;
  fuelPercent: number;
}

export interface Alert {
  id: string;
  message: string;
  // "WARNING" | "DANGER"
  type: string;
}

export interface State {
  // "CLEAR" | "STORMY" | "FOGGY"
  weatherCondition: string;
  // "ALL" | "SCHEDULED" | "IN_FLIGHT" | "LANDED"
  filterStatus: string;
  selectedFlightId: string;
  alerts: Alert[];
  flights: Flight[];
}

// one line per row of the spec's action table (Action Type + Payload Format)
export type Action =
  | { type: "SELECT_FLIGHT"; payload: string }
  | { type: "UPDATE_STATUS"; payload: { flightId: string; status: string } }
  | { type: "ADJUST_ALTITUDE"; payload: { flightId: string; amount: number } }
  | { type: "CONSUME_FUEL"; payload: { flightId: string; amount: number } }
  | { type: "SET_WEATHER"; payload: string }
  | { type: "ADD_FLIGHT"; payload: { destination: string } }
  | { type: "DISMISS_ALERT"; payload: string }
  // extra (not in the action table): filterStatus is in the state, so it needs an action to change it
  | { type: "SET_FILTER"; payload: string };


// ========================================
// INITIAL STATE  (copied exactly from the spec)
// ========================================

export const initialState: State = {
  weatherCondition: "CLEAR",
  filterStatus: "ALL",
  selectedFlightId: "FL-101",
  alerts: [],
  flights: [
    { id: "FL-101", destination: "Tokyo (NRT)", status: "IN_FLIGHT", altitude: 32000, fuelPercent: 65 },
    { id: "FL-204", destination: "London (LHR)", status: "SCHEDULED", altitude: 0, fuelPercent: 100 },
    { id: "FL-309", destination: "New York (JFK)", status: "IN_FLIGHT", altitude: 28000, fuelPercent: 15 },
    { id: "FL-412", destination: "Paris (CDG)", status: "LANDED", altitude: 0, fuelPercent: 40 },
  ],
};


// helper: a new alert with its own id
const makeAlert = (message: string, type: string): Alert => ({
  id: "AL-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
  message,
  type,
});


// ========================================
// REDUCER  (every rule of the action table lives here)
// ========================================

export const fleetReducer = (state: State, action: Action): State => {
  switch (action.type) {
    // SELECT_FLIGHT: set selectedFlightId to the given id
    case "SELECT_FLIGHT":
      return { ...state, selectedFlightId: action.payload };


    // UPDATE_STATUS: change the status of one flight
    // rule: status "LANDED" -> altitude becomes 0
    case "UPDATE_STATUS": {
      const updatedFlights = state.flights.map((flight) => {
        // not the flight we want -> keep it as it is
        if (flight.id !== action.payload.flightId) return flight;

        return {
          ...flight,
          status: action.payload.status,
          altitude: action.payload.status === "LANDED" ? 0 : flight.altitude,
        };
      });

      return { ...state, flights: updatedFlights };
    }


    // ADJUST_ALTITUDE: altitude + amount (e.g. +2000 or -2000)
    // rules: stay between 0 and 45000, and above 0 -> status "IN_FLIGHT"
    case "ADJUST_ALTITUDE": {
      const updatedFlights = state.flights.map((flight) => {
        if (flight.id !== action.payload.flightId) return flight;

        const newAltitude = Math.min(45000, Math.max(0, flight.altitude + action.payload.amount));

        return {
          ...flight,
          altitude: newAltitude,
          status: newAltitude > 0 ? "IN_FLIGHT" : flight.status,
        };
      });

      return { ...state, flights: updatedFlights };
    }


    // CONSUME_FUEL: fuelPercent - amount (never below 0)
    // rules: fuel reaches 0 -> DANGER alert
    //        fuel below 20 while IN_FLIGHT -> WARNING alert
    case "CONSUME_FUEL": {
      // 1. find the flight
      const target = state.flights.find((flight) => flight.id === action.payload.flightId);
      // unknown id -> change nothing
      if (!target) return state;

      // 2. the new value, never below 0
      const newFuel = Math.max(0, target.fuelPercent - action.payload.amount);

      // 3. put the new value into that one flight
      const updatedFlights = state.flights.map((flight) =>
        flight.id === target.id ? { ...flight, fuelPercent: newFuel } : flight
      );

      // 4. the rules -> maybe add ONE alert (DANGER is checked first because it's worse)
      let newAlerts = state.alerts;

      if (newFuel === 0) {
        newAlerts = state.alerts.concat(makeAlert(`${target.id} is out of fuel!`, "DANGER"));
      } else if (newFuel < 20 && target.status === "IN_FLIGHT") {
        newAlerts = state.alerts.concat(makeAlert(`${target.id} fuel is low (${newFuel}%)`, "WARNING"));
      }

      // 5. both lists changed -> return both
      return { ...state, flights: updatedFlights, alerts: newAlerts };
    }


    // SET_WEATHER: set weatherCondition
    // rule: "STORMY" -> add a global DANGER alert
    case "SET_WEATHER": {
      let newAlerts = state.alerts;

      if (action.payload === "STORMY") {
        newAlerts = state.alerts.concat(
          makeAlert("Severe storm detected! All flights hold altitude.", "DANGER")
        );
      }

      return { ...state, weatherCondition: action.payload, alerts: newAlerts };
    }


    // ADD_FLIGHT: a new flight with the spec's starting values
    case "ADD_FLIGHT": {
      const newFlight: Flight = {
        id: "FL-" + Math.floor(100 + Math.random() * 900),
        destination: action.payload.destination,
        status: "SCHEDULED",
        altitude: 0,
        fuelPercent: 100,
      };

      return { ...state, flights: state.flights.concat(newFlight) };
    }


    // DISMISS_ALERT: remove that alert
    case "DISMISS_ALERT":
      return { ...state, alerts: state.alerts.filter((alert) => alert.id !== action.payload) };


    // SET_FILTER (extra): which flights FlightTable shows
    case "SET_FILTER":
      return { ...state, filterStatus: action.payload };


    default:
      return state;
  }
};


// ========================================
// CONTEXT + PROVIDER  (gives state + dispatch to every child)
// ========================================

export const FleetContext = createContext<
  { state: State; dispatch: Dispatch<Action> } | undefined
>(undefined);

export const FleetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(fleetReducer, initialState);

  return (
    <FleetContext.Provider value={{ state, dispatch }}>
      {children}
    </FleetContext.Provider>
  );
};
