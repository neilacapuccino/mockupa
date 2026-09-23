# Exam 1 - How to answer a "reducer" exam (the SkyControl type)

This type of paper gives you: a **scenario**, an **initial state**, an **action table** with rules,
a **component list**, and a **checklist**. It is frontend only: no backend, no database, no fetch.
Past paper: `variations/10-skycontrol/SPEC.md`. Solution: `variations/10-skycontrol/frontend/src/`.

**Part 1 - Before you type**
1. The time plan (2.5 hours)
2. Read and mark the paper (10 minutes)
3. Paper section -> code (the map)

**Part 2 - Build it, in this order**
4. Create the project (5 minutes)
5. The context file, without rules
6. App.tsx and the components
7. Add the rules
8. Test with the checklist

**Part 3 - When things go wrong**
9. If you run out of time: what to do first
10. Errors you will see and the fix

**Part 4 - Submit**
11. Delete node_modules and zip

---

# Part 1 - Before you type

## 1. The time plan (2.5 hours)

| Time | Do | Done when |
|---|---|---|
| 0:00 - 0:10 | read and mark the paper (step 2) | you know every state field, action, and rule |
| 0:10 - 0:15 | create the project + empty files (step 4) | `npm run dev` shows a page |
| 0:15 - 0:45 | context file: types, initialState, reducer WITHOUT rules, Provider (step 5) | no red underlines |
| 0:45 - 1:15 | App.tsx + every component with its buttons (step 6) | every button changes something on screen |
| 1:15 - 1:50 | add the rules to the reducer (step 7) | each rule works when you click |
| 1:50 - 2:15 | test with the checklist (step 8) | every checklist box is ticked |
| 2:15 - 2:30 | delete node_modules, zip, submit (step 11) | submitted |

**Why this order:** a working app WITHOUT rules gets many checklist points (Provider, dispatch, clicking a row).
Rules are added last, one at a time. A half-written rule must never break the whole app.

## 2. Read and mark the paper (10 minutes)

Use 3 marks on the paper:

| Mark | What to mark | Becomes |
|---|---|---|
| **box** | every field in the initial state | `State` interface + `initialState` |
| **underline** | every action type in the table | an `Action` line + a `case` + a `dispatch` |
| **circle** | every rule word: *if, when, must, cannot, never, between, below, above, only, becomes, automatically* | an `if`, a ternary, `Math.min/max`, or an early `return state` |

Then write a small table like this on scratch paper (it is `FRONTEND-5-REDUCER-RULES.md` step 3):

| Action | Changes | Also changes (rules) |
|---|---|---|
| ADJUST_ALTITUDE | altitude (0 - 45000) | status -> IN_FLIGHT if above 0 |
| CONSUME_FUEL | fuelPercent (min 0) | alerts (WARNING / DANGER) |
| SET_WEATHER | weatherCondition | alerts (DANGER if STORMY) |

## 3. Paper section -> code (the map)

| Paper section | Code | Guide |
|---|---|---|
| Scenario | nothing (just read it) | - |
| Requirements ("Context", "Reducer", "Components") | the file structure and the Provider | `FRONTEND-0-CONCEPTS.md` |
| Initial state shape | `State`, item interfaces, `initialState` (copy it exactly) | `FRONTEND-1-TYPES.md` |
| Action table: Action type + Payload | the `Action` type | `FRONTEND-4-ACTIONS.md` part 2 |
| Action table: what it does / rules | the reducer cases | `FRONTEND-4-ACTIONS.md` + `FRONTEND-5-REDUCER-RULES.md` |
| Tip / example code on the paper | copy it into your reducer, it is always correct | - |
| Component hierarchy | one file per component, which buttons go where | `FRONTEND-4-ACTIONS.md` step 8 |
| Checklist | your test list at the end | step 8 below |
| Submission | zip name and what to delete | step 11 below |

---

# Part 2 - Build it, in this order

## 4. Create the project (5 minutes)

Change the names (`skycontrol`, `FleetContext`, the component names) to the ones on your paper.

```powershell
npx -y create-vite@latest skycontrol --template react-ts --no-interactive
cd skycontrol
npm i
mkdir src/context, src/components
ni src/context/FleetContext.tsx, src/components/WeatherToolbar.tsx, src/components/FlightTable.tsx, src/components/ControlPanel.tsx, src/components/AlertList.tsx
Clear-Content src/App.css, src/index.css
npm run dev
```
Open the link it prints (usually http://localhost:5173). Leave it running: the page updates every time you save.

If the paper has a `types/index.ts`, also run `mkdir src/types` and `ni src/types/index.ts`
and put the types there instead (`FRONTEND-4-ACTIONS.md` step 2 shows both layouts).

## 5. The context file, without rules

Write the file in this order. Every case does only the simple part for now.
Complete worked file: `variations/10-skycontrol/frontend/src/context/FleetContext.tsx`.

```tsx
// FleetContext.tsx - createContext, the reducer function, and FleetProvider
import { createContext, useReducer, type Dispatch, type ReactNode } from "react";

// 1. TYPES (from "Initial State Shape")
export interface Flight {
  id: string;
  destination: string;
  status: string;
  altitude: number;
  fuelPercent: number;
}

export interface Alert {
  id: string;
  message: string;
  type: string;
}

export interface State {
  weatherCondition: string;
  filterStatus: string;
  selectedFlightId: string;
  alerts: Alert[];
  flights: Flight[];
}

// 2. ACTIONS (one line per row of the action table)
export type Action =
  | { type: "SELECT_FLIGHT"; payload: string }
  | { type: "ADJUST_ALTITUDE"; payload: { flightId: string; amount: number } }
  | { type: "DISMISS_ALERT"; payload: string };
  // ... the other rows

// 3. INITIAL STATE (copy it exactly from the paper)
const initialState: State = {
  weatherCondition: "CLEAR",
  filterStatus: "ALL",
  selectedFlightId: "FL-101",
  alerts: [],
  flights: [
    { id: "FL-101", destination: "Tokyo (NRT)", status: "IN_FLIGHT", altitude: 32000, fuelPercent: 65 },
    // ... the other flights
  ],
};

// 4. REDUCER (simple version first, rules in step 7)
const fleetReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SELECT_FLIGHT":
      return { ...state, selectedFlightId: action.payload };

    case "ADJUST_ALTITUDE":
      return {
        ...state,
        flights: state.flights.map((flight) =>
          flight.id === action.payload.flightId
            ? { ...flight, altitude: flight.altitude + action.payload.amount }
            : flight
        ),
      };

    case "DISMISS_ALERT":
      return { ...state, alerts: state.alerts.filter((alert) => alert.id !== action.payload) };

    // ... one case per row

    default:
      return state;
  }
};

// 5. CONTEXT + PROVIDER (the same every time, only the names change)
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
```

What to change for a different paper:

| Part | Change |
|---|---|
| 1. Types | the interfaces (copy the field names from the initial state) |
| 2. Actions | one line per row (`FRONTEND-4-ACTIONS.md` step 3) |
| 3. Initial state | copy it from the paper |
| 4. Reducer | one case per row (`FRONTEND-4-ACTIONS.md` step 4) |
| 5. Context + Provider | only the names: `FleetContext`, `FleetProvider`, `fleetReducer` |

## 6. App.tsx and the components

**App.tsx** - always the same shape: the Provider around everything.
```tsx
import { FleetProvider } from "./context/FleetContext";
import { AlertList } from "./components/AlertList";
import { WeatherToolbar } from "./components/WeatherToolbar";
import { FlightTable } from "./components/FlightTable";
import { ControlPanel } from "./components/ControlPanel";

function App() {
  return (
    <FleetProvider>
      <h1>SkyControl</h1>
      <AlertList />
      <WeatherToolbar />
      <FlightTable />
      <ControlPanel />
    </FleetProvider>
  );
}

export default App;
```

**Every component** starts with the same 4 lines:
```tsx
import { useContext } from "react";
import { FleetContext } from "../context/FleetContext";

export const AlertList: React.FC = () => {
  const context = useContext(FleetContext);
  if (!context) throw new Error("AlertList must be used within FleetProvider");
  const { state, dispatch } = context;

  // show something from state, and buttons that dispatch
  return (
    <ul>
      {state.alerts.map((alert) => (
        <li key={alert.id}>
          [{alert.type}] {alert.message}{" "}
          <button onClick={() => dispatch({ type: "DISMISS_ALERT", payload: alert.id })}>Dismiss</button>
        </li>
      ))}
    </ul>
  );
};
```

Which buttons go in which component: read the component descriptions on the paper
(`FRONTEND-4-ACTIONS.md` step 8). Plain HTML is fine: `<button>`, `<select>`, `<table>`, `<ul>`.
Save after each component and look at the page.

## 7. Add the rules

Go through the circled words on the paper, **one rule at a time**. After each rule: save, click, check.

| Rule on the paper | Code | Guide |
|---|---|---|
| "between 0 and 45000" | `Math.min(45000, Math.max(0, value))` | `FRONTEND-5` step 4 |
| "if LANDED, altitude becomes 0" | `altitude: status === "LANDED" ? 0 : flight.altitude` | `FRONTEND-5` step 5 |
| "below 20 -> WARNING alert" | `let newAlerts = state.alerts; if (...) newAlerts = state.alerts.concat(...)` | `FRONTEND-5` step 6 |
| "cannot ..." | `if (...) return state;` | `FRONTEND-5` step 7 |

A case that changes 2 parts of the state (for example flights AND alerts) must return both:
`return { ...state, flights: updatedFlights, alerts: newAlerts };`

## 8. Test with the checklist

Turn every checklist line into a click test. SkyControl's checklist:

| Checklist line | Click test |
|---|---|
| wrapped in `<FleetProvider>` | the page loads with no error |
| weather, altitude, fuel, status all use dispatch | every button changes the screen |
| altitude bounds | +2000 many times stops at 45000; -2000 on 0 ft stays 0 |
| fuel below 20% shows a banner | FL-309 (15%) -> Burn 5% -> WARNING |
| clicking FlightTable changes ControlPanel | click FL-204 -> the panel shows FL-204 |
| lists stay 1D | `flights` and `alerts` are simple arrays of objects (no arrays inside arrays) |

Also press F12: the Console tab must have no red errors.

---

# Part 3 - When things go wrong

## 9. If you run out of time: what to do first

Points come from things that WORK. Priority order:

1. The app runs and shows the initial state (types + initialState + Provider + App)
2. Every action has a case and a button (even without its rules)
3. The rules the checklist names (for SkyControl: altitude bounds and the fuel banner)
4. The other rules
5. Looks (a table, colours for DANGER/WARNING, the selected row highlighted)

If one case has an error you can't fix, make it simple again (`return state;`) so the rest still runs.
A page that does not compile gets almost nothing.

## 10. Errors you will see and the fix

| Error (red underline or on the page) | Cause | Fix |
|---|---|---|
| `must be used within FleetProvider` (your own throw) | the component is outside the Provider | put it inside `<FleetProvider>` in App.tsx |
| `Property 'payload' does not exist on type ...` | the Action line has no payload, or the type name is misspelled | fix the Action line so it matches the dispatch exactly |
| `Type '"FL-101"' is not assignable ... ` / `Object literal may only specify known properties` | the dispatch payload does not match the Action line | compare the two, name by name |
| `'x' is declared but its value is never read` | an unused import or variable | delete it |
| `... is a type and must be imported using a type-only import` | `verbatimModuleSyntax` is on | `import type { State } from ...` or `import { type Dispatch } from "react"` |
| `Type 'string' is not assignable to type '"CLEAR" \| "STORMY" \| "FOGGY"'` | strict union type + a value from a `<select>` | use `string` in the type, or cast: `e.target.value as State["weatherCondition"]` |
| `Cannot find name 'React'` for `React.FC` / `React.FormEvent` | rare, depends on the setup | `import type { FC, FormEvent } from "react";` and use `FC` / `FormEvent` |
| `"2000" + 32000 = "200032000"` | the value from an input is a string | `Number(e.target.value)` |
| a click does nothing | the case forgot `...state`, or the id check is wrong | `console.log(action)` at the top of the reducer (`FRONTEND-5` step 16) |
| every other flight disappears | `map` without `return flight` for the others | add the "otherwise keep it" branch |
| blank white page | an error while rendering | F12 -> Console, read the first red line |
| `Each child in a list should have a unique "key" prop` | `map` in JSX without `key` | `key={flight.id}` on the outer element |

---

# Part 4 - Submit

## 11. Delete node_modules and zip

From the folder that CONTAINS your project (stop `npm run dev` first with Ctrl+C):

```powershell
Remove-Item -Recurse -Force skycontrol\node_modules
Compress-Archive -Path skycontrol -DestinationPath Lastname1_Lastname2.zip
```
Use the zip name the paper asks for. Open the zip once to check the `src` folder is inside.

Practice: open `variations/10-skycontrol/SPEC.md`, close the solution, and do it again in 2.5 hours.
