# Frontend 2 - `src/context/...Context.tsx`

The context file = **the global state**: `initialState` + the reducer + the Provider.
It uses `State` and `Action` from `FRONTEND-1-TYPES.md`.
Next: `FRONTEND-3-SERVICE.md` (the functions that call the backend).

**Part 1 - The general approach**
1. The shape of the file
2. initialState - one starting value per State field

**Part 2 - Translate**
3. Action -> reducer case (recipes)
4. Worked example: PulseDesk
5. A different project: Books

**Part 3 - Using it**
6. Wrap the app in the Provider
7. Read the state and dispatch from any component

**Part 4 - Rules and final check**
8. Reducer rules
9. Before you run it

---

# Part 1 - The general approach

## 1. The shape of the file

```tsx
import { createContext, useReducer, type Dispatch, type ReactNode } from "react";
import type { State, Action } from "../types";

// 1. the starting values
const initialState: State = {
  // one line per field in State
};

// 2. the reducer: (old state, action) -> NEW state
const appReducer = (state: State, action: Action): State => {
  switch (action.type) {
    // one case per action
    default:
      return state;
  }
};

// 3. the context (what components read)
export const AppContext = createContext<
  { state: State; dispatch: Dispatch<Action> } | undefined
>(undefined);

// 4. the Provider (wraps the app, holds the state)
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};
```

Parts 3 and 4 are **the same in every project** - only the names change.
You write parts 1 and 2.

## 2. initialState - one starting value per State field

| Field in State | Starting value |
|---|---|
| `user: {...} \| null` | `null` |
| `token: string \| null` | `localStorage.getItem("token")` (stay logged in after refresh) |
| a list `items: Item[]` | `[]` |
| `loading: boolean` | `false` |
| `error: string \| null` | `null` |
| a filter `filter: string` | its first option, e.g. `"all"` |
| a page `page: number` | `1` |
| an open item `selected: Item \| null` | `null` |

---

# Part 2 - Translate

## 3. Action -> reducer case (recipes)

Look at the action's **name** and **payload** - it tells you which recipe to use.

| The action... | Recipe |
|---|---|
| sets a value (`SET_AUTH`, `SET_ERROR`, `SET_FILTER`) | `return { ...state, field: action.payload };` |
| loads a list (`FETCH_SUCCESS`) | `return { ...state, loading: false, items: action.payload };` |
| starts loading (`FETCH_START`) | `return { ...state, loading: true, error: null };` |
| adds one (`CREATE_SUCCESS`, `ADD_...`) | `items: [action.payload, ...state.items]` |
| changes one (`UPDATE_SUCCESS`, `EDIT_...`) | `items: state.items.map((i) => i.id === action.payload.id ? action.payload : i)` |
| removes one by id (`DELETE_SUCCESS`, `REMOVE_...`) | `items: state.items.filter((i) => i.id !== action.payload)` |
| changes one field of one item by id (`CANCEL_...`) | `items: state.items.map((i) => i.id === action.payload ? { ...i, status: "cancelled" } : i)` |
| logs out (`LOGOUT`) | `return { ...state, user: null, token: null, items: [] };` |
| shows an error (`SET_ERROR`) | `return { ...state, loading: false, error: action.payload };` |

Every case:

```tsx
case "ACTION_NAME":
  return { ...state, /* only what changes */ };
```

`...state` copies everything else, so you only write what changes.

## 4. Worked example: PulseDesk

Spec actions: `SET_AUTH`, `FETCH_SUCCESS`, `CREATE_SUCCESS`, `UPDATE_SUCCESS`, `DELETE_SUCCESS`, `SET_ERROR`
(+ extras `FETCH_START`, `LOGOUT`).

```tsx
// FULL FILE: pulsedesk
import { createContext, useReducer, type Dispatch, type ReactNode } from "react";
import type { State, Action } from "../types";

const initialState: State = {
  user: null,
  token: localStorage.getItem("token"),
  incidents: [],
  loading: false,
  error: null,
};

const incidentReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_AUTH":
      return { ...state, user: action.payload.user, token: action.payload.token, error: null };

    case "LOGOUT":
      return { ...state, user: null, token: null, incidents: [], error: null };

    case "FETCH_START":
      return { ...state, loading: true, error: null };

    case "FETCH_SUCCESS":
      return { ...state, loading: false, incidents: action.payload };

    case "CREATE_SUCCESS":
      return { ...state, incidents: [action.payload, ...state.incidents], error: null };

    case "UPDATE_SUCCESS":
      return {
        ...state,
        incidents: state.incidents.map((incident) =>
          incident.id === action.payload.id ? action.payload : incident
        ),
        error: null,
      };

    case "DELETE_SUCCESS":
      return {
        ...state,
        incidents: state.incidents.filter((incident) => incident.id !== action.payload),
        error: null,
      };

    case "SET_ERROR":
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
};

export const IncidentContext = createContext<
  { state: State; dispatch: Dispatch<Action> } | undefined
>(undefined);

export const IncidentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(incidentReducer, initialState);

  return (
    <IncidentContext.Provider value={{ state, dispatch }}>
      {children}
    </IncidentContext.Provider>
  );
};
```

## 5. A different project: Books

Spec actions: `SET_AUTH`, `LOGOUT`, `FETCH_START`, `FETCH_SUCCESS`, `ADD_BOOK`, `UPDATE_BOOK`,
`REMOVE_BOOK`, `SET_FILTER`, `SET_ERROR` (types -> `FRONTEND-1-TYPES.md` section 6).

What changes from PulseDesk:

| PulseDesk | Books |
|---|---|
| `incidents: []` | `books: []`, `filter: "all"` |
| `case "CREATE_SUCCESS"` | `case "ADD_BOOK"` (same recipe: add one) |
| `case "UPDATE_SUCCESS"` | `case "UPDATE_BOOK"` (same recipe: change one) |
| `case "DELETE_SUCCESS"` | `case "REMOVE_BOOK"` (same recipe: remove one) |
| - | `case "SET_FILTER"` (recipe: set a value) |
| `IncidentContext` / `IncidentProvider` | `BookContext` / `BookProvider` |

```tsx
// FULL FILE: books
import { createContext, useReducer, type Dispatch, type ReactNode } from "react";
import type { State, Action } from "../types";

const initialState: State = {
  user: null,
  token: localStorage.getItem("token"),
  books: [],
  filter: "all",
  loading: false,
  error: null,
};

const bookReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_AUTH":
      return { ...state, user: action.payload.user, token: action.payload.token, error: null };

    case "LOGOUT":
      return { ...state, user: null, token: null, books: [], error: null };

    case "FETCH_START":
      return { ...state, loading: true, error: null };

    case "FETCH_SUCCESS":
      return { ...state, loading: false, books: action.payload };

    case "ADD_BOOK":
      return { ...state, books: [action.payload, ...state.books], error: null };

    case "UPDATE_BOOK":
      return {
        ...state,
        books: state.books.map((book) => (book.id === action.payload.id ? action.payload : book)),
        error: null,
      };

    case "REMOVE_BOOK":
      return {
        ...state,
        books: state.books.filter((book) => book.id !== action.payload),
        error: null,
      };

    case "SET_FILTER":
      return { ...state, filter: action.payload };

    case "SET_ERROR":
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
};

export const BookContext = createContext<
  { state: State; dispatch: Dispatch<Action> } | undefined
>(undefined);

export const BookProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(bookReducer, initialState);

  return (
    <BookContext.Provider value={{ state, dispatch }}>
      {children}
    </BookContext.Provider>
  );
};
```

---

# Part 3 - Using it

## 6. Wrap the app in the Provider

`App.tsx` - the Provider goes around everything. `MainApp` is separate because a component
can't read a Provider that it renders itself.

```tsx
function App() {
  return (
    <IncidentProvider>
      <MainApp />
    </IncidentProvider>
  );
}

export default App;
```

## 7. Read the state and dispatch from any component

```tsx
import { useContext } from "react";
import { IncidentContext } from "../context/IncidentContext";

export const IncidentList: React.FC = () => {
  const context = useContext(IncidentContext);
  if (!context) throw new Error("IncidentList must be used within IncidentProvider");
  const { state, dispatch } = context;

  // CHANGE the state: dispatch an action
  // (the real app calls deleteIncident() first - FRONTEND-3-SERVICE.md section 14)
  const handleRemove = (id: string) => {
    dispatch({ type: "DELETE_SUCCESS", payload: id });
  };

  // READ the state: state.incidents, state.loading, state.error ...
  return (
    <ul>
      {state.incidents.map((incident) => (
        <li key={incident.id}>
          {incident.title} <button onClick={() => handleRemove(incident.id)}>Remove</button>
        </li>
      ))}
    </ul>
  );
};
```

Service call + dispatch (the full pattern) -> `FRONTEND-3-SERVICE.md` section 14.

---

# Part 4 - Rules and final check

## 8. Reducer rules

| Rule | Wrong | Right |
|---|---|---|
| always return a NEW object | `state.items.push(x); return state;` | `return { ...state, items: [...state.items, x] };` |
| no fetch / localStorage inside the reducer | `case "SET_AUTH": localStorage.setItem(...)` | do it in the component, before `dispatch` |
| every case returns | a case with no `return` | `return { ...state, ... };` |
| keep the `default` | no default | `default: return state;` |
| a `const` inside a case needs `{ }` | `case "ADD": const x = ...` | `case "ADD": { const x = ...; return ...; }` |

## 9. Before you run it

| Check | What goes wrong if you skip it |
|---|---|
| One `case` for every action in `Action` | dispatching it does nothing |
| The case names are spelled exactly like the spec (`"CREATE_SUCCESS"`) | TypeScript error, or nothing happens |
| `initialState` has every field of `State` | TypeScript error "missing property" |
| The list field name matches State (`incidents`, not `items`) | the list stays empty |
| `import type { State, Action } from "../types";` has `type` | Vite error |
| `App.tsx` wraps everything in the Provider | "must be used within ...Provider" |
