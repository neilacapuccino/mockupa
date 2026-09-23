# Frontend 0 - Concepts: state, action, reducer, context, global dispatch

Read this first. It explains the ideas. The other FRONTEND guides show the code for each file.
Worked example used here: **SkyControl** (the prelim paper), `variations/10-skycontrol/`.

**Part 1 - The five words**
1. The words in one table
2. The picture: what happens when you click a button

**Part 2 - Global dispatching**
3. What it means
4. Where it is in the code

**Part 3 - Deciding what goes in the state**
5. Global state, local state, or derived?
6. Store ids, not copies

**Part 4 - Situations (state + action + case + dispatch)**
7. Twelve common situations

**Part 5 - Mistakes**
8. The mistakes that break things

---

# Part 1 - The five words

## 1. The words in one table

| Word | What it is | SkyControl example | Lives in |
|---|---|---|---|
| **State** | ONE object with all the data the screen shows | `{ weatherCondition, filterStatus, selectedFlightId, alerts, flights }` | context file (`initialState`) |
| **Action** | a small object that says what happened: `{ type, payload }` | `{ type: "SELECT_FLIGHT", payload: "FL-204" }` | `Action` type (types file or top of context file) |
| **Reducer** | a function: `(old state, action) => new state`. ALL the rules are here | `fleetReducer` | context file |
| **Context** | the "pipe" that lets any component reach the state without props | `FleetContext` | context file |
| **Dispatch** | the function that sends an action to the reducer | `dispatch({ type: "SET_WEATHER", payload: "STORMY" })` | called inside components |

Two more words you see in exam papers:

| Word | Meaning |
|---|---|
| **Provider** | the component that holds the state (`useReducer`) and gives it to everything inside it: `<FleetProvider>` |
| **Payload** | the data that comes with the action (an id, a number, an object). Some actions have no payload |

## 2. The picture: what happens when you click a button

```
 ControlPanel                      FleetContext.tsx                      every component using the context
 ------------                      ----------------                      ---------------------------------
 click "+2000"
      |
      v
 dispatch({ type: "ADJUST_ALTITUDE",
            payload: { flightId: "FL-204", amount: 2000 } })
      |
      +------------------------->  fleetReducer(oldState, action)
                                   case "ADJUST_ALTITUDE":
                                     new altitude = 2000 (between 0 and 45000)
                                     status -> "IN_FLIGHT"
                                   return NEW state
                                          |
                                          +----------------------->  FlightTable shows 2000 ft, IN_FLIGHT
                                                                     ControlPanel shows 2000 ft
```

- The component does NOT change anything itself. It only says what happened.
- The reducer decides the new state (and checks the rules).
- React redraws every component that reads the context. You never "refresh" a component yourself.

---

# Part 2 - Global dispatching

## 3. What it means

**Global dispatching = `dispatch` is put inside the Provider's `value`, so ANY component can send actions,
no matter where it is in the tree, and without passing props.**

Without it (props):
```
App -> passes onSelect to FlightTable
App -> passes flight + onChange to ControlPanel
App -> passes onDismiss to AlertList
```

With it (global):
```
FlightTable:   dispatch({ type: "SELECT_FLIGHT", payload: id })
ControlPanel:  reads state.selectedFlightId, shows that flight
AlertList:     dispatch({ type: "DISMISS_ALERT", payload: id })
```
FlightTable and ControlPanel do not know each other. They talk **through the state**:
FlightTable changes `selectedFlightId` and ControlPanel reads it.
(This is the checklist item "clicking a row in FlightTable changes ControlPanel".)

## 4. Where it is in the code

Three places. If one is missing, global dispatch does not work.

```tsx
// 1. context file: put dispatch in the value
export const FleetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(fleetReducer, initialState);

  return (
    <FleetContext.Provider value={{ state, dispatch }}>
      {children}
    </FleetContext.Provider>
  );
};
```

```tsx
// 2. App.tsx: everything that needs it must be INSIDE the Provider
function App() {
  return (
    <FleetProvider>
      <FlightTable />
      <ControlPanel />
    </FleetProvider>
  );
}
```

```tsx
// 3. any component: take it out of the context and use it
const context = useContext(FleetContext);
if (!context) throw new Error("FlightTable must be used within FleetProvider");
const { state, dispatch } = context;
```

---

# Part 3 - Deciding what goes in the state

## 5. Global state, local state, or derived?

Ask these 3 questions for every piece of data:

| Question | Answer | Put it... | SkyControl example |
|---|---|---|---|
| Can I calculate it from what is already in the state? | yes | **nowhere**: calculate it in the component (derived) | the filtered list, the selected flight object, number of alerts |
| Do 2+ components need it, or does the exam list it in the state? | yes | **global state** (initialState + an action to change it) | `flights`, `alerts`, `selectedFlightId`, `weatherCondition` |
| Only one component needs it, only while typing? | yes | **local** `useState` in that component | the text in the "New flight" input before you click Add |

Derived values, written in the component (not stored):
```tsx
// the list after the filter
const visibleFlights =
  state.filterStatus === "ALL"
    ? state.flights
    : state.flights.filter((flight) => flight.status === state.filterStatus);

// the selected flight object
const flight = state.flights.find((f) => f.id === state.selectedFlightId);

// counts / totals
const inFlightCount = state.flights.filter((f) => f.status === "IN_FLIGHT").length;
const dangerCount = state.alerts.filter((a) => a.type === "DANGER").length;
```

## 6. Store ids, not copies

```ts
// GOOD: only the id. The flight object is found from the list every time.
selectedFlightId: "FL-101"

// BAD: a copy. When the list changes (fuel burns), this copy still shows the OLD numbers.
selectedFlight: { id: "FL-101", fuelPercent: 65 }
```

---

# Part 4 - Situations

## 7. Twelve common situations

Each situation shows the same 4 pieces: **state field**, **action**, **reducer case**, **dispatch in a component**.
The item is called `item` / `items`. Rename it to your exam's word (flight, book, order...).

### 7.1 Show a list (loaded or starting data)
```ts
// state
items: Item[]
// action
| { type: "SET_ITEMS"; payload: Item[] }
```
```ts
case "SET_ITEMS":
  return { ...state, items: action.payload };
```
```tsx
dispatch({ type: "SET_ITEMS", payload: data });
```

### 7.2 Add one item
```ts
| { type: "ADD_ITEM"; payload: { name: string } }
```
```ts
case "ADD_ITEM": {
  const newItem: Item = { id: "IT-" + Date.now(), name: action.payload.name, done: false };
  return { ...state, items: state.items.concat(newItem) };
}
```
```tsx
dispatch({ type: "ADD_ITEM", payload: { name } });
```

### 7.3 Remove one item
```ts
| { type: "REMOVE_ITEM"; payload: string }
```
```ts
case "REMOVE_ITEM":
  return { ...state, items: state.items.filter((item) => item.id !== action.payload) };
```
```tsx
<button onClick={() => dispatch({ type: "REMOVE_ITEM", payload: item.id })}>Remove</button>
```

### 7.4 Change one field of one item
```ts
| { type: "UPDATE_STATUS"; payload: { id: string; status: string } }
```
```ts
case "UPDATE_STATUS":
  return {
    ...state,
    items: state.items.map((item) =>
      item.id === action.payload.id ? { ...item, status: action.payload.status } : item
    ),
  };
```
```tsx
<select value={item.status} onChange={(e) => dispatch({ type: "UPDATE_STATUS", payload: { id: item.id, status: e.target.value } })}>
```

### 7.5 Toggle (true / false)
```ts
| { type: "TOGGLE_DONE"; payload: string }
```
```ts
case "TOGGLE_DONE":
  return {
    ...state,
    items: state.items.map((item) =>
      item.id === action.payload ? { ...item, done: !item.done } : item
    ),
  };
```
```tsx
<input type="checkbox" checked={item.done} onChange={() => dispatch({ type: "TOGGLE_DONE", payload: item.id })} />
```

### 7.6 Select one item (list on the left, details on the right)
```ts
// state
selectedId: string | null
// action
| { type: "SELECT_ITEM"; payload: string }
```
```ts
case "SELECT_ITEM":
  return { ...state, selectedId: action.payload };
```
```tsx
// in the list
<tr onClick={() => dispatch({ type: "SELECT_ITEM", payload: item.id })}>
// in the details panel (derived)
const selected = state.items.find((item) => item.id === state.selectedId);
```

### 7.7 Filter or search
```ts
// state
filterStatus: string
// action
| { type: "SET_FILTER"; payload: string }
```
```ts
case "SET_FILTER":
  return { ...state, filterStatus: action.payload };
```
```tsx
// the list itself is NOT changed. The component calculates what to show.
const visible = state.filterStatus === "ALL" ? state.items : state.items.filter((i) => i.status === state.filterStatus);
```

### 7.8 One setting (weather, theme, mode, sort order)
```ts
| { type: "SET_WEATHER"; payload: string }
```
```ts
case "SET_WEATHER":
  return { ...state, weatherCondition: action.payload };
```
```tsx
<button onClick={() => dispatch({ type: "SET_WEATHER", payload: "FOGGY" })}>FOGGY</button>
```

### 7.9 A number with limits (quantity, altitude, volume, score)
```ts
| { type: "ADJUST_QTY"; payload: { id: string; amount: number } }
```
```ts
case "ADJUST_QTY":
  return {
    ...state,
    items: state.items.map((item) =>
      item.id === action.payload.id
        ? { ...item, qty: Math.min(10, Math.max(0, item.qty + action.payload.amount)) }
        : item
    ),
  };
```
```tsx
<button onClick={() => dispatch({ type: "ADJUST_QTY", payload: { id: item.id, amount: -1 } })}>-</button>
```
More limit rules: `FRONTEND-5-REDUCER-RULES.md`.

### 7.10 Alerts / notifications (added by a rule, removed by a button)
```ts
// state
alerts: Alert[]
// action
| { type: "DISMISS_ALERT"; payload: string }
```
```ts
// ADD: inside another case, when a rule says so
let newAlerts = state.alerts;
if (newFuel < 20) {
  newAlerts = state.alerts.concat({ id: "AL-" + Date.now(), message: "Low fuel", type: "WARNING" });
}

// REMOVE
case "DISMISS_ALERT":
  return { ...state, alerts: state.alerts.filter((alert) => alert.id !== action.payload) };
```

### 7.11 Cart (add the same item again = add 1 to its quantity)
```ts
| { type: "ADD_TO_CART"; payload: Product }
```
```ts
case "ADD_TO_CART": {
  const existing = state.cart.find((line) => line.id === action.payload.id);

  if (existing) {
    return {
      ...state,
      cart: state.cart.map((line) =>
        line.id === action.payload.id ? { ...line, qty: line.qty + 1 } : line
      ),
    };
  }

  return { ...state, cart: state.cart.concat({ ...action.payload, qty: 1 }) };
}
```

### 7.12 Reset everything
```ts
| { type: "RESET" }
```
```ts
case "RESET":
  return initialState;
```
```tsx
<button onClick={() => dispatch({ type: "RESET" })}>Reset</button>
```

Backend situations (loading, error, login/logout with a token) are in `FRONTEND-2-CONTEXT.md`.

---

# Part 5 - Mistakes

## 8. The mistakes that break things

| Mistake | Why it breaks | Do this instead |
|---|---|---|
| `state.flights.push(newFlight)` | changes the old state, so React does not see a change | `state.flights.concat(newFlight)` |
| `flight.altitude = 5000` | same | `{ ...flight, altitude: 5000 }` inside a `map` |
| `return { flights: newFlights }` | every other field disappears | `return { ...state, flights: newFlights }` |
| `map((f) => { if (...) {...} })` with no `return f` | the other items become `undefined` | always `return flight;` for the ones you don't change |
| `case` with no `return` | falls into the next case | every case ends with `return` |
| forgot `default: return state;` | unknown action returns `undefined` | always add the default |
| rules written in the component | the exam says "reducer handles all validation" | components only dispatch |
| storing the filtered list or the selected object | gets out of date | derive it (Part 3) |
| component outside `<FleetProvider>` | `context` is `undefined` -> your throw message | wrap in `App.tsx` |
| `amount: e.target.value` from an input | it's a string, `"2000"` | `Number(e.target.value)` |
| `Math.random()` / `Date.now()` in the component to make an id | works, but the spec usually says the reducer creates it | make the id inside the reducer case |

Next: `FRONTEND-4-ACTIONS.md` (turn every row of an action table into code).
