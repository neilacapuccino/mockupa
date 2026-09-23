# 10. SkyControl - Flight Fleet Dashboard (SE 2144 Prelim, frontend only)

This is the real prelim paper, typed out. There is NO backend: everything lives in React state.

- **Time:** 2.5 hours
- **Topics:** `useReducer`, `createContext`, global dispatch, state validation
- **Worked solution:** `frontend/src/`
- **How to turn a row of the action table into code:** `../../FRONTEND-4-ACTIONS.md`
- **How to turn a rule into if/else code:** `../../FRONTEND-5-REDUCER-RULES.md`

---

## Scenario
You are building a real-time dashboard for an airline's operations center.
It tracks flights, weather, and alerts. All data changes go through ONE reducer.

## Requirements
1. **Context:** create a `FleetContext` and a `FleetProvider` that gives `state` and `dispatch` to the whole app.
2. **Reducer:** a pure reducer does every change and every validation rule.
   Use `map` / `filter` / `concat` (never change the old state directly).
3. **Components:** children read the context with `useContext(FleetContext)` and only **dispatch actions**.
   No rules inside components.

---

## Initial state shape
```ts
const initialState = {
  weatherCondition: "CLEAR",     // 'CLEAR' | 'STORMY' | 'FOGGY'
  filterStatus: "ALL",           // 'ALL' | 'SCHEDULED' | 'IN_FLIGHT' | 'LANDED'
  selectedFlightId: "FL-101",
  alerts: [],                    // { id, message, type: 'WARNING' | 'DANGER' }
  flights: [
    { id: "FL-101", destination: "Tokyo (NRT)",    status: "IN_FLIGHT", altitude: 32000, fuelPercent: 65 },
    { id: "FL-204", destination: "London (LHR)",   status: "SCHEDULED", altitude: 0,     fuelPercent: 100 },
    { id: "FL-309", destination: "New York (JFK)", status: "IN_FLIGHT", altitude: 28000, fuelPercent: 15 },
    { id: "FL-412", destination: "Paris (CDG)",    status: "LANDED",    altitude: 0,     fuelPercent: 40 },
  ],
};
```

---

## Action table
| Action type | Payload format | Rule / what it must do |
|---|---|---|
| `SELECT_FLIGHT` | `string` (flight id) | set `selectedFlightId` |
| `UPDATE_STATUS` | `{ flightId, status }` | set that flight's status. If the status is `LANDED`, altitude becomes `0` |
| `ADJUST_ALTITUDE` | `{ flightId, amount }` | add `amount` to the altitude. Must stay between `0` and `45000`. If the new altitude is above 0, status becomes `IN_FLIGHT` |
| `CONSUME_FUEL` | `{ flightId, amount }` | subtract `amount` from `fuelPercent`. Never below `0`. Below `20` while `IN_FLIGHT` -> add a `WARNING` alert. Reaches `0` -> add a `DANGER` alert |
| `SET_WEATHER` | `string` | set `weatherCondition`. If `STORMY` -> add a `DANGER` alert: "Severe storm detected! All flights hold altitude." |
| `ADD_FLIGHT` | `{ destination }` | add a flight: id `"FL-" + Math.floor(100 + Math.random() * 900)`, status `SCHEDULED`, altitude `0`, fuelPercent `100` |
| `DISMISS_ALERT` | `string` (alert id) | remove that alert |

> `filterStatus` is in the state but the paper has no action for it.
> The solution adds `SET_FILTER` (payload: `string`) so the table filter works.

### Tip printed on the paper (ADJUST_ALTITUDE)
```ts
case "ADJUST_ALTITUDE":
  return {
    ...state,
    flights: state.flights.map((flight) => {
      if (flight.id !== action.payload.flightId) return flight;
      const newAltitude = Math.min(45000, Math.max(0, flight.altitude + action.payload.amount));
      return {
        ...flight,
        altitude: newAltitude,
        status: newAltitude > 0 ? "IN_FLIGHT" : flight.status,
      };
    }),
  };
```

---

## Component hierarchy
```
src/
  context/
    FleetContext.tsx      <- createContext, the reducer function, FleetProvider
  components/
    WeatherToolbar.tsx    <- weather selection buttons + "New Flight" input form
    FlightTable.tsx       <- displays filtered flights; highlights the selected flight
    ControlPanel.tsx      <- detailed controls for the currently selected flight
    AlertList.tsx         <- warning and danger banners with dismiss buttons
  App.tsx                 <- shell layout wrapped inside <FleetProvider>
```

---

## Checklist (graded)
- [ ] The app is wrapped in `<FleetProvider>`
- [ ] Weather, altitude, fuel and status changes all go through `dispatch`
- [ ] Altitude never goes below 0 or above 45000
- [ ] Fuel below 20% shows a warning banner
- [ ] Clicking a row in `FlightTable` changes what `ControlPanel` shows
- [ ] Lists stay one-dimensional (no arrays inside arrays)

## Submit
Delete `node_modules`, then zip the project as `<last_name1>_<last_name2>.zip`.

---

## Run it
```powershell
cd "C:\Users\Higurashi\OneDrive\Documents\task force\mockupa\variations\10-skycontrol\frontend"
npm i
npm run dev
```
Or open the variations page (`npm run dev` in `variations/`) and click **10. SkyControl**.
No database or backend is needed.

## Things to try (each one tests a rule)
| Do this | You should see |
|---|---|
| Select FL-309, click **Burn 5%** | fuel 10% + a WARNING banner (it was already below 20) |
| Keep burning FL-309 | fuel stops at 0 + a DANGER banner |
| Select FL-204 (SCHEDULED), click **Burn 20%** | fuel 80%, no banner |
| Select FL-204, click **+2000** | altitude 2000, status becomes IN_FLIGHT |
| Select FL-101, set status to **LANDED** | altitude becomes 0 |
| Click **+2000** many times | altitude stops at 45000 |
| Click **STORMY** | the storm DANGER banner |
| Add a flight "Manila (MNL)" | new row: SCHEDULED, 0 ft, 100% |
| Filter **LANDED** | only the landed flights are shown |
