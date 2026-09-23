# Frontend 4 - Action table -> code (and where each piece goes)

Exam papers give you a table like this:

| Action type | Payload format | What it does |
|---|---|---|
| `ADJUST_ALTITUDE` | `{ flightId, amount }` | add amount, keep it between 0 and 45000, above 0 -> IN_FLIGHT |

This guide turns every row into code, for ANY project.
Worked example: **SkyControl** (the prelim paper), the solution is in `variations/10-skycontrol/frontend/src/`.
Ideas behind it: `FRONTEND-0-CONCEPTS.md`. Rules (if / else): `FRONTEND-5-REDUCER-RULES.md`.

**Part 1 - One row = three pieces**
1. The three pieces
2. Where the pieces go (4 kinds of project layout)

**Part 2 - Translate each column**
3. "Payload format" column -> the Action line
4. "What it does" column -> the reducer case
5. The payload -> the dispatch call in a component

**Part 3 - Worked example: SkyControl, row by row**
6. The Action type (all rows)
7. Each row: case + dispatch
8. Which component dispatches what

**Part 4 - The same method on a different paper**
9. ParkWise (parking lot), 5 rows

**Part 5 - Final check**
10. Checklist

---

# Part 1 - One row = three pieces

## 1. The three pieces

Every row of the action table becomes exactly 3 things:

| # | Piece | Example for `SELECT_FLIGHT` | File |
|---|---|---|---|
| 1 | a line in the `Action` type | `\| { type: "SELECT_FLIGHT"; payload: string }` | types file (or top of the context file) |
| 2 | a `case` in the reducer | `case "SELECT_FLIGHT": return { ...state, selectedFlightId: action.payload };` | context file |
| 3 | a `dispatch(...)` in a component | `dispatch({ type: "SELECT_FLIGHT", payload: flight.id })` | the component with the button / row / input |

Write them in that order: **type -> case -> dispatch**.
If piece 1 is missing, TypeScript underlines pieces 2 and 3 in red. That is a useful check.

## 2. Where the pieces go (4 kinds of project layout)

Look at the "component hierarchy" / "file structure" part of the paper and pick the layout that matches.

**Layout A - the paper has `types/index.ts` (PulseDesk style)**
```
src/
  types/index.ts                  <- piece 1 (State, Action, item interfaces)
  context/IncidentContext.tsx     <- piece 2 (initialState, reducer, Provider)
  components/IncidentList.tsx     <- piece 3
```
```tsx
// in the context file
import type { State, Action } from "../types";
// in a component
import { IncidentContext } from "../context/IncidentContext";
```

**Layout B - the paper says "FleetContext.tsx: createContext, the reducer function, FleetProvider" and has no types folder (SkyControl style)**
```
src/
  context/FleetContext.tsx        <- piece 1 AND piece 2 (types at the top, exported)
  components/ControlPanel.tsx     <- piece 3
```
```tsx
// in a component (types are imported from the context file if a component needs them)
import { FleetContext, type Flight } from "../context/FleetContext";
```

**Layout C - the paper has a separate reducer file**
```
src/
  types/index.ts                  <- piece 1
  reducers/fleetReducer.ts        <- piece 2 (initialState + reducer, both exported)
  context/FleetContext.tsx        <- only createContext + Provider
  components/...                  <- piece 3
```
```tsx
// in context/FleetContext.tsx
import { fleetReducer, initialState } from "../reducers/fleetReducer";
```

**Layout D - everything in one file (short quizzes)**
```
src/App.tsx   <- types, initialState, reducer, context, Provider, components, App
```
Same code, same order, top to bottom. Nothing is imported.

**The rule for all layouts:** types first, then the reducer, then the Provider, then the components.
A component never contains a reducer case, and the reducer never contains JSX.

---

# Part 2 - Translate each column

## 3. "Payload format" column -> the Action line

| Paper says | Action line |
|---|---|
| `string` (an id) | `\| { type: "SELECT_FLIGHT"; payload: string }` |
| `number` (an id) | `\| { type: "REMOVE_BOOK"; payload: number }` |
| `{ flightId, status }` | `\| { type: "UPDATE_STATUS"; payload: { flightId: string; status: string } }` |
| `{ flightId, amount }` | `\| { type: "ADJUST_ALTITUDE"; payload: { flightId: string; amount: number } }` |
| `{ destination }` | `\| { type: "ADD_FLIGHT"; payload: { destination: string } }` |
| `Flight` (a whole object) | `\| { type: "ADD_FLIGHT"; payload: Flight }` |
| `Flight[]` (a list) | `\| { type: "SET_FLIGHTS"; payload: Flight[] }` |
| `none` / `-` / empty | `\| { type: "RESET" }` (no payload at all) |
| `'CLEAR' \| 'STORMY' \| 'FOGGY'` | `\| { type: "SET_WEATHER"; payload: string }` (simple) or `payload: "CLEAR" \| "STORMY" \| "FOGGY"` (strict) |

How to guess the type of each field:

| Field name looks like | Type |
|---|---|
| `...Id`, `name`, `destination`, `status`, `message` | `string` |
| `amount`, `altitude`, `qty`, `price`, `percent`, `count` | `number` |
| `is...`, `has...`, `done`, `open` | `boolean` |

If you use the strict version (`"CLEAR" | "STORMY" | "FOGGY"`), a value from a `<select>` needs a cast:
`payload: e.target.value as State["weatherCondition"]`. The simple `string` version needs no cast.

## 4. "What it does" column -> the reducer case

Find the verb in the row. Each verb has one recipe.

| Paper says | Recipe |
|---|---|
| "sets X" / "changes X" (a single value) | `return { ...state, x: action.payload };` |
| "adds" / "creates" / "appends" | `return { ...state, items: state.items.concat(newItem) };` |
| "removes" / "deletes" / "dismisses" | `return { ...state, items: state.items.filter((i) => i.id !== action.payload) };` |
| "updates X of one item" | `items: state.items.map((i) => i.id === action.payload.id ? { ...i, x: action.payload.x } : i)` |
| "toggles" | `map` + `{ ...i, done: !i.done }` |
| "loads" / "replaces the list" | `return { ...state, items: action.payload };` |
| "resets" / "clears" | `return initialState;` or `return { ...state, items: [] };` |
| "must stay between" / "if ... then ..." / "cannot" | a rule: see `FRONTEND-5-REDUCER-RULES.md` |

The shape of every case:
```ts
case "ACTION_NAME": {
  // 1. calculate the new value(s)
  // 2. check the rules (if / else)
  // 3. return { ...state, <every field that changed> };
}
```
Use `{ }` after the case when you declare a `const` or `let` inside it.

## 5. The payload -> the dispatch call in a component

The object you dispatch must have **exactly** the shape of the Action line.

| Where the value comes from | Dispatch |
|---|---|
| a fixed button | `onClick={() => dispatch({ type: "ADJUST_ALTITUDE", payload: { flightId: flight.id, amount: 2000 } })}` |
| a row / item you click | `onClick={() => dispatch({ type: "SELECT_FLIGHT", payload: flight.id })}` |
| a `<select>` | `onChange={(e) => dispatch({ type: "SET_FILTER", payload: e.target.value })}` |
| a number input | `payload: { flightId: flight.id, amount: Number(e.target.value) }` |
| a form (text you typed) | local `useState` while typing, then dispatch in `onSubmit` (see below) |
| a checkbox | `onChange={() => dispatch({ type: "TOGGLE_DONE", payload: item.id })}` |

The form pattern:
```tsx
const [destination, setDestination] = useState("");

const handleAdd = (e: React.FormEvent) => {
  e.preventDefault();
  dispatch({ type: "ADD_FLIGHT", payload: { destination } });
  setDestination("");
};

return (
  <form onSubmit={handleAdd}>
    <input value={destination} onChange={(e) => setDestination(e.target.value)} required />
    <button type="submit">Add flight</button>
  </form>
);
```

---

# Part 3 - Worked example: SkyControl, row by row

## 6. The Action type (all rows)

One line per row, copied from the table. SkyControl is Layout B, so this goes at the top of `context/FleetContext.tsx`.

```ts
export type Action =
  | { type: "SELECT_FLIGHT"; payload: string }
  | { type: "UPDATE_STATUS"; payload: { flightId: string; status: string } }
  | { type: "ADJUST_ALTITUDE"; payload: { flightId: string; amount: number } }
  | { type: "CONSUME_FUEL"; payload: { flightId: string; amount: number } }
  | { type: "SET_WEATHER"; payload: string }
  | { type: "ADD_FLIGHT"; payload: { destination: string } }
  | { type: "DISMISS_ALERT"; payload: string }
  // extra: filterStatus is in the state but the table has no action for it
  | { type: "SET_FILTER"; payload: string };
```

Tip: if the state has a field that no action changes (like `filterStatus`), add your own action for it
and write a short comment saying why.

## 7. Each row: case + dispatch

### Row 1 - `SELECT_FLIGHT` | `string` | set `selectedFlightId`
```ts
case "SELECT_FLIGHT":
  return { ...state, selectedFlightId: action.payload };
```
```tsx
// FlightTable.tsx - on each row
<tr key={flight.id} onClick={() => dispatch({ type: "SELECT_FLIGHT", payload: flight.id })}>
```

### Row 2 - `UPDATE_STATUS` | `{ flightId, status }` | set the status, LANDED -> altitude 0
```ts
case "UPDATE_STATUS": {
  const updatedFlights = state.flights.map((flight) => {
    if (flight.id !== action.payload.flightId) return flight;

    return {
      ...flight,
      status: action.payload.status,
      altitude: action.payload.status === "LANDED" ? 0 : flight.altitude,
    };
  });

  return { ...state, flights: updatedFlights };
}
```
```tsx
// ControlPanel.tsx
<select
  value={flight.status}
  onChange={(e) => dispatch({ type: "UPDATE_STATUS", payload: { flightId: flight.id, status: e.target.value } })}
>
```

### Row 3 - `ADJUST_ALTITUDE` | `{ flightId, amount }` | between 0 and 45000, above 0 -> IN_FLIGHT
```ts
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
```
```tsx
// ControlPanel.tsx - the amount is fixed on each button
<button onClick={() => dispatch({ type: "ADJUST_ALTITUDE", payload: { flightId: flight.id, amount: -2000 } })}>-2000</button>
<button onClick={() => dispatch({ type: "ADJUST_ALTITUDE", payload: { flightId: flight.id, amount: 2000 } })}>+2000</button>
```

### Row 4 - `CONSUME_FUEL` | `{ flightId, amount }` | never below 0, alerts at <20 and at 0
This row changes TWO parts of the state (`flights` AND `alerts`), so it is longer.
```ts
case "CONSUME_FUEL": {
  // 1. find the flight
  const target = state.flights.find((flight) => flight.id === action.payload.flightId);
  if (!target) return state;

  // 2. the new value, never below 0
  const newFuel = Math.max(0, target.fuelPercent - action.payload.amount);

  // 3. put it into that one flight
  const updatedFlights = state.flights.map((flight) =>
    flight.id === target.id ? { ...flight, fuelPercent: newFuel } : flight
  );

  // 4. the rules -> maybe one new alert
  let newAlerts = state.alerts;

  if (newFuel === 0) {
    newAlerts = state.alerts.concat(makeAlert(`${target.id} is out of fuel!`, "DANGER"));
  } else if (newFuel < 20 && target.status === "IN_FLIGHT") {
    newAlerts = state.alerts.concat(makeAlert(`${target.id} fuel is low (${newFuel}%)`, "WARNING"));
  }

  // 5. return both changed parts
  return { ...state, flights: updatedFlights, alerts: newAlerts };
}
```
The helper, written once above the reducer:
```ts
const makeAlert = (message: string, type: string): Alert => ({
  id: "AL-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
  message,
  type,
});
```
```tsx
// ControlPanel.tsx
<button onClick={() => dispatch({ type: "CONSUME_FUEL", payload: { flightId: flight.id, amount: 5 } })}>Burn 5%</button>
```

### Row 5 - `SET_WEATHER` | `string` | set the weather, STORMY -> DANGER alert
```ts
case "SET_WEATHER": {
  let newAlerts = state.alerts;

  if (action.payload === "STORMY") {
    newAlerts = state.alerts.concat(
      makeAlert("Severe storm detected! All flights hold altitude.", "DANGER")
    );
  }

  return { ...state, weatherCondition: action.payload, alerts: newAlerts };
}
```
```tsx
// WeatherToolbar.tsx - one button per weather value
{["CLEAR", "STORMY", "FOGGY"].map((weather) => (
  <button key={weather} onClick={() => dispatch({ type: "SET_WEATHER", payload: weather })}>
    {weather}
  </button>
))}
```

### Row 6 - `ADD_FLIGHT` | `{ destination }` | new flight with fixed starting values
```ts
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
```
```tsx
// WeatherToolbar.tsx - the form pattern from step 5
dispatch({ type: "ADD_FLIGHT", payload: { destination } });
```

### Row 7 - `DISMISS_ALERT` | `string` | remove that alert
```ts
case "DISMISS_ALERT":
  return { ...state, alerts: state.alerts.filter((alert) => alert.id !== action.payload) };
```
```tsx
// AlertList.tsx
<button onClick={() => dispatch({ type: "DISMISS_ALERT", payload: alert.id })}>Dismiss</button>
```

### Extra - `SET_FILTER` | `string`
```ts
case "SET_FILTER":
  return { ...state, filterStatus: action.payload };
```
```tsx
// FlightTable.tsx
<select value={state.filterStatus} onChange={(e) => dispatch({ type: "SET_FILTER", payload: e.target.value })}>
```

## 8. Which component dispatches what

Read the component descriptions on the paper. The button for an action goes where the description says.

| Component (paper description) | Reads from state | Dispatches |
|---|---|---|
| `WeatherToolbar` - "weather selection buttons + New Flight input form" | `weatherCondition` | `SET_WEATHER`, `ADD_FLIGHT` |
| `FlightTable` - "displays filtered flights; highlights the selected flight" | `flights`, `filterStatus`, `selectedFlightId` | `SELECT_FLIGHT`, `SET_FILTER` |
| `ControlPanel` - "detailed controls for the currently selected flight" | `flights`, `selectedFlightId` | `UPDATE_STATUS`, `ADJUST_ALTITUDE`, `CONSUME_FUEL` |
| `AlertList` - "warning and danger banners with dismiss buttons" | `alerts` | `DISMISS_ALERT` |
| `App` - "shell layout wrapped inside FleetProvider" | nothing | nothing |

Every row of the action table should appear once in the "Dispatches" column.
If a row is missing there, you have no button for it. That is a lost checklist point.

---

# Part 4 - The same method on a different paper

## 9. ParkWise (parking lot), 5 rows

| Action type | Payload | What it does |
|---|---|---|
| `PARK_CAR` | `{ plate }` | add a car: id "P-" + random, `status: "PARKED"`, `hours: 0` |
| `ADD_HOURS` | `{ carId, hours }` | add hours, max 24 |
| `CHECKOUT` | `string` (car id) | status -> "LEFT", fee = hours x 40 |
| `SET_RATE` | `number` | set `ratePerHour` |
| `REMOVE_CAR` | `string` (car id) | remove the car |

Piece 1: types (`types/index.ts` or top of `ParkingContext.tsx`)
```ts
export interface Car {
  id: string;
  plate: string;
  status: string;
  hours: number;
  fee: number;
}

export interface State {
  ratePerHour: number;
  cars: Car[];
}

export type Action =
  | { type: "PARK_CAR"; payload: { plate: string } }
  | { type: "ADD_HOURS"; payload: { carId: string; hours: number } }
  | { type: "CHECKOUT"; payload: string }
  | { type: "SET_RATE"; payload: number }
  | { type: "REMOVE_CAR"; payload: string };
```

Piece 2: the reducer (`context/ParkingContext.tsx`)
```ts
const parkingReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "PARK_CAR": {
      const newCar: Car = {
        id: "P-" + Math.floor(100 + Math.random() * 900),
        plate: action.payload.plate,
        status: "PARKED",
        hours: 0,
        fee: 0,
      };
      return { ...state, cars: state.cars.concat(newCar) };
    }

    case "ADD_HOURS":
      return {
        ...state,
        cars: state.cars.map((car) =>
          car.id === action.payload.carId
            ? { ...car, hours: Math.min(24, car.hours + action.payload.hours) }
            : car
        ),
      };

    case "CHECKOUT":
      return {
        ...state,
        cars: state.cars.map((car) =>
          car.id === action.payload
            ? { ...car, status: "LEFT", fee: car.hours * state.ratePerHour }
            : car
        ),
      };

    case "SET_RATE":
      return { ...state, ratePerHour: action.payload };

    case "REMOVE_CAR":
      return { ...state, cars: state.cars.filter((car) => car.id !== action.payload) };

    default:
      return state;
  }
};
```
(The paper says "x 40", but `ratePerHour` exists in the state, so the fee uses `state.ratePerHour`.
Start it at 40 in `initialState`.)

Piece 3: the dispatches (components)
```tsx
dispatch({ type: "PARK_CAR", payload: { plate } });
dispatch({ type: "ADD_HOURS", payload: { carId: car.id, hours: 1 } });
dispatch({ type: "CHECKOUT", payload: car.id });
dispatch({ type: "SET_RATE", payload: Number(e.target.value) });
dispatch({ type: "REMOVE_CAR", payload: car.id });
```

---

# Part 5 - Final check

## 10. Checklist

- [ ] Every row of the table has a line in `Action` (same spelling as the paper, same payload shape)
- [ ] Every row has a `case` that ends with `return { ...state, ... }`
- [ ] Every row has at least one `dispatch` somewhere in a component (step 8 table)
- [ ] Every state field that must change has an action (add your own if the table forgot one)
- [ ] `default: return state;` is there
- [ ] No red underlines: `npx tsc -b` shows nothing
- [ ] Click every button once and watch the screen change

Next: `FRONTEND-5-REDUCER-RULES.md` (the "if", "must stay between", "cannot" parts of each row).
