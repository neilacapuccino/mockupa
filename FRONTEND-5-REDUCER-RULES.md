# Frontend 5 - Rules in the reducer (if / else, limits, automatic changes, alerts)

The hard part of the prelim was not the actions. It was the sentences like:
- "Must stay between 0 and 45000"
- "If the status is LANDED, altitude becomes 0"
- "Below 20 while IN_FLIGHT -> add a WARNING alert"

This guide turns those sentences into code, and shows **which code is affected** when one value changes.
Worked example: SkyControl, `variations/10-skycontrol/frontend/src/context/FleetContext.tsx`.

**Part 1 - The method**
1. Where rules go
2. The 5-step recipe for a case with rules
3. Which code is affected? (the dependency table)

**Part 2 - The dictionary: sentence -> code**
4. Limits (min, max, between)
5. Automatic changes to another field
6. Adding alerts / logs / history
7. Rejecting a change (early return)

**Part 3 - The if / else shapes**
8. Ternary: one field depends on another
9. if / else if: only one of several outcomes (order matters)
10. Separate ifs: several things can happen together
11. Early return: stop and change nothing
12. Rule that looks at another part of the state
13. Rule that changes every item

**Part 4 - What if the exam changes the rule?**
14. Fifteen changed rules, with the code

**Part 5 - Testing the rules**
15. Test by clicking
16. Quick console check

---

# Part 1 - The method

## 1. Where rules go

**All rules go in the reducer.** The paper says it: "a pure reducer handles all transformations and validation".
Components only dispatch. They never check `if (altitude > 45000)`.

```
Component:  dispatch({ type: "ADJUST_ALTITUDE", payload: { flightId: "FL-101", amount: 20000 } })
Reducer:    32000 + 20000 = 52000 -> too high -> 45000 (the rule)
```

## 2. The 5-step recipe for a case with rules

Every case with rules follows the same 5 steps. Write the step comments first, then fill them in.

```ts
case "CONSUME_FUEL": {
  // 1. FIND the item (and stop if it does not exist)
  const target = state.flights.find((flight) => flight.id === action.payload.flightId);
  if (!target) return state;

  // 2. CALCULATE the new value, with its limits
  const newFuel = Math.max(0, target.fuelPercent - action.payload.amount);

  // 3. BUILD the new list with the new value
  const updatedFlights = state.flights.map((flight) =>
    flight.id === target.id ? { ...flight, fuelPercent: newFuel } : flight
  );

  // 4. CHECK the rules that change OTHER parts of the state
  let newAlerts = state.alerts;
  if (newFuel === 0) {
    newAlerts = state.alerts.concat(makeAlert(`${target.id} is out of fuel!`, "DANGER"));
  } else if (newFuel < 20 && target.status === "IN_FLIGHT") {
    newAlerts = state.alerts.concat(makeAlert(`${target.id} fuel is low (${newFuel}%)`, "WARNING"));
  }

  // 5. RETURN every part that changed
  return { ...state, flights: updatedFlights, alerts: newAlerts };
}
```

Short cases (no step 4) can do steps 1-3 inside one `map`, like `ADJUST_ALTITUDE` on the paper.

## 3. Which code is affected? (the dependency table)

Before writing a case, fill in this table on paper. It shows everything that must change.

| When this changes... | ...this also changes | Where it is | Code |
|---|---|---|---|
| `altitude` (ADJUST_ALTITUDE) | `status` of the SAME flight | same item | inside the `map`: `status: newAltitude > 0 ? "IN_FLIGHT" : flight.status` |
| `status` to LANDED (UPDATE_STATUS) | `altitude` of the SAME flight | same item | inside the `map`: `altitude: status === "LANDED" ? 0 : flight.altitude` |
| `fuelPercent` (CONSUME_FUEL) | `alerts` | another part of the state | `let newAlerts` + `alerts: newAlerts` in the return |
| `weatherCondition` (SET_WEATHER) | `alerts` | another part of the state | `let newAlerts` + `alerts: newAlerts` in the return |
| `flights` gets a new item (ADD_FLIGHT) | nothing | - | only `flights` |
| `selectedFlightId` (SELECT_FLIGHT) | what ControlPanel shows | a component | nothing to write: the component re-renders by itself |

How to read a rule sentence:

```
"If the status is LANDED,   altitude   becomes 0"
   \____ condition ____/   \_ field _/  \_ value _/
```
- **condition** -> the `if` / the left side of `? :`
- **field** -> the thing you change. Is it in the same item? Write it inside the `map`.
  Is it somewhere else in the state (alerts, a counter, a log)? Use a separate variable and add it to the `return`.
- **value** -> what you set it to

**Components are not affected.** When the state changes, every component that reads it shows the new value.
You only change a component when you need a NEW button or a NEW thing on the screen.

---

# Part 2 - The dictionary: sentence -> code

## 4. Limits (min, max, between)

| Paper says | Code |
|---|---|
| "cannot go below 0" / "never negative" / "minimum 0" | `Math.max(0, value)` |
| "cannot exceed 100" / "maximum 100" / "capped at 100" | `Math.min(100, value)` |
| "must stay between 0 and 45000" / "bounded" / "clamped" | `Math.min(45000, Math.max(0, value))` |
| "rounded" | `Math.round(value)` |
| "whole number of percent" | `Math.round((part / total) * 100)` |

Remember: `Math.max` sets the **bottom** limit, `Math.min` sets the **top** limit (it feels backwards).
```ts
// between MIN and MAX: max first (bottom), then min (top)
const newAltitude = Math.min(45000, Math.max(0, flight.altitude + action.payload.amount));
```

The same thing with if / else, if you find it easier to read:
```ts
let newAltitude = flight.altitude + action.payload.amount;

if (newAltitude > 45000) {
  newAltitude = 45000;
} else if (newAltitude < 0) {
  newAltitude = 0;
}
```

If the limit may change, give it a name at the top of the file:
```ts
const MAX_ALTITUDE = 45000;
const LOW_FUEL = 20;
```

## 5. Automatic changes to another field

| Paper says | Code (inside the `map`, in the returned item) |
|---|---|
| "If status is LANDED, altitude becomes 0" | `altitude: action.payload.status === "LANDED" ? 0 : flight.altitude` |
| "If altitude is above 0, status becomes IN_FLIGHT" | `status: newAltitude > 0 ? "IN_FLIGHT" : flight.status` |
| "If stock reaches 0, status becomes OUT_OF_STOCK" | `status: newStock === 0 ? "OUT_OF_STOCK" : item.status` |
| "Mark as done when progress reaches 100" | `done: newProgress >= 100` |
| "Total = price x qty" | `total: item.price * newQty` |

The pattern: `field: CONDITION ? NEW_VALUE : item.field`.
The `: item.field` part means "otherwise keep what it was". Don't forget it.

Which value do you check, the old or the new?
- "if the altitude **becomes** / **is now** above 0" -> check the NEW value (`newAltitude`)
- "if the flight **was** IN_FLIGHT" -> check the OLD item (`flight.status` / `target.status`)
- "while IN_FLIGHT" (CONSUME_FUEL) -> the old status, because burning fuel does not change the status

## 6. Adding alerts / logs / history

Alerts live in a different part of the state, so use a variable that starts as the old list:
```ts
let newAlerts = state.alerts;

if (CONDITION) {
  newAlerts = state.alerts.concat(makeAlert("the message", "WARNING"));
}

return { ...state, flights: updatedFlights, alerts: newAlerts };
```
- No alert needed -> `newAlerts` is still the old list, nothing changes.
- The `return` must include `alerts: newAlerts`, or the alert is lost.

The message can use values from the item:
```ts
makeAlert(`${target.id} fuel is low (${newFuel}%)`, "WARNING")
```

The same idea works for a history / log list:
```ts
let newLog = state.log;
if (newStatus === "LANDED") {
  newLog = state.log.concat(`${target.id} landed`);
}
```

## 7. Rejecting a change (early return)

| Paper says | Code (at the top of the case) |
|---|---|
| "ignore if the flight does not exist" | `if (!target) return state;` |
| "a LANDED flight cannot change altitude" | `if (target.status === "LANDED") return state;` |
| "destination cannot be empty" | `if (action.payload.destination.trim() === "") return state;` |
| "no duplicate names" | `if (state.flights.some((f) => f.destination === action.payload.destination)) return state;` |
| "maximum 10 flights" | `if (state.flights.length >= 10) return state;` |
| "cannot go back from LANDED to SCHEDULED" | `if (target.status === "LANDED" && action.payload.status === "SCHEDULED") return state;` |

`return state;` means "nothing happened". The screen does not change.

If the paper says "reject **and show a message**", return the old data plus an alert:
```ts
if (target.status === "LANDED") {
  return {
    ...state,
    alerts: state.alerts.concat(makeAlert(`${target.id} has landed and cannot change altitude`, "WARNING")),
  };
}
```

---

# Part 3 - The if / else shapes

## 8. Ternary: one field depends on another
Use it when the rule changes a field of the **same item**, with an "otherwise keep it".
```ts
return {
  ...flight,
  altitude: newAltitude,
  status: newAltitude > 0 ? "IN_FLIGHT" : flight.status,
};
```
Same thing, written with if:
```ts
let newStatus = flight.status;
if (newAltitude > 0) {
  newStatus = "IN_FLIGHT";
}

return { ...flight, altitude: newAltitude, status: newStatus };
```

## 9. if / else if: only one of several outcomes (order matters)
Fuel 0 is ALSO below 20. With `else if`, only the first true branch runs, so check the **worst case first**.
```ts
if (newFuel === 0) {
  // DANGER only
  newAlerts = state.alerts.concat(makeAlert("out of fuel", "DANGER"));
} else if (newFuel < 20 && target.status === "IN_FLIGHT") {
  // WARNING only
  newAlerts = state.alerts.concat(makeAlert("low fuel", "WARNING"));
}
```
Wrong order: `if (newFuel < 20) ... else if (newFuel === 0) ...` means the DANGER branch can never run.

More levels work the same way, from the highest to the lowest:
```ts
let level = "OK";

if (newFuel === 0) {
  level = "EMPTY";
} else if (newFuel < 10) {
  level = "CRITICAL";
} else if (newFuel < 20) {
  level = "LOW";
}
```

## 10. Separate ifs: several things can happen together
Use separate `if`s (no `else`) when both can be true and **both** must happen.
Example rule: "Below 20 -> WARNING. Also, if the weather is STORMY -> DANGER."
```ts
let newAlerts = state.alerts;

if (newFuel < 20) {
  newAlerts = newAlerts.concat(makeAlert("low fuel", "WARNING"));
}

if (state.weatherCondition === "STORMY") {
  newAlerts = newAlerts.concat(makeAlert("burning fuel in a storm", "DANGER"));
}
```
Note: `newAlerts.concat(...)`, not `state.alerts.concat(...)`. Otherwise the second `if` erases the first alert.

## 11. Early return: stop and change nothing
Put the checks at the top of the case, before any calculation.
```ts
case "ADJUST_ALTITUDE": {
  const target = state.flights.find((flight) => flight.id === action.payload.flightId);

  // the rules that STOP the action
  if (!target) return state;
  if (target.status === "LANDED") return state;

  // the normal work
  const newAltitude = Math.min(45000, Math.max(0, target.altitude + action.payload.amount));
  const updatedFlights = state.flights.map((flight) =>
    flight.id === target.id
      ? { ...flight, altitude: newAltitude, status: newAltitude > 0 ? "IN_FLIGHT" : flight.status }
      : flight
  );

  return { ...state, flights: updatedFlights };
}
```

## 12. Rule that looks at another part of the state
Rules can read ANY part of `state`, not only the item.
Example rule: "During a storm, all flights hold altitude (altitude cannot change)."
```ts
case "ADJUST_ALTITUDE": {
  if (state.weatherCondition === "STORMY") return state;

  // ... the normal ADJUST_ALTITUDE code
}
```

## 13. Rule that changes every item
Use `map` with no id check.
Example rule: "When STORMY, every IN_FLIGHT flight drops 1000 ft."
```ts
case "SET_WEATHER": {
  let updatedFlights = state.flights;
  let newAlerts = state.alerts;

  if (action.payload === "STORMY") {
    updatedFlights = state.flights.map((flight) =>
      flight.status === "IN_FLIGHT"
        ? { ...flight, altitude: Math.max(0, flight.altitude - 1000) }
        : flight
    );
    newAlerts = state.alerts.concat(makeAlert("Severe storm detected! All flights hold altitude.", "DANGER"));
  }

  return { ...state, weatherCondition: action.payload, flights: updatedFlights, alerts: newAlerts };
}
```

---

# Part 4 - What if the exam changes the rule?

## 14. Fifteen changed rules, with the code

Each one says what the new rule is, **which code is affected**, and the new code.
Everything else in the file stays the same.

**1. "Altitude limit is 40000" (the number changes)**
Affected: the one number in ADJUST_ALTITUDE.
```ts
const newAltitude = Math.min(40000, Math.max(0, flight.altitude + action.payload.amount));
```

**2. "Warning below 25% instead of 20%"**
Affected: one number in CONSUME_FUEL.
```ts
} else if (newFuel < 25 && target.status === "IN_FLIGHT") {
```

**3. "Warning for every flight, not only IN_FLIGHT"**
Affected: remove one part of the condition.
```ts
} else if (newFuel < 20) {
```

**4. "Fuel reaches 0 -> the flight is LANDED and altitude 0"**
Affected: the `map` in CONSUME_FUEL now changes 3 fields instead of 1.
```ts
const updatedFlights = state.flights.map((flight) =>
  flight.id === target.id
    ? {
        ...flight,
        fuelPercent: newFuel,
        status: newFuel === 0 ? "LANDED" : flight.status,
        altitude: newFuel === 0 ? 0 : flight.altitude,
      }
    : flight
);
```

**5. "LANDED -> also refuel to 100"**
Affected: one more line in the UPDATE_STATUS `map`.
```ts
return {
  ...flight,
  status: action.payload.status,
  altitude: action.payload.status === "LANDED" ? 0 : flight.altitude,
  fuelPercent: action.payload.status === "LANDED" ? 100 : flight.fuelPercent,
};
```

**6. "Altitude 0 -> status becomes LANDED" (the other direction)**
Affected: the status ternary in ADJUST_ALTITUDE gets a second level.
```ts
status: newAltitude > 0 ? "IN_FLIGHT" : "LANDED",
```

**7. "A LANDED flight cannot change status"**
Affected: an early return at the top of UPDATE_STATUS (needs `find` first).
```ts
case "UPDATE_STATUS": {
  const target = state.flights.find((flight) => flight.id === action.payload.flightId);
  if (!target || target.status === "LANDED") return state;
  // ... the normal map
}
```

**8. "No altitude changes during a storm"**
Affected: an early return in ADJUST_ALTITUDE that reads another part of the state.
```ts
if (state.weatherCondition === "STORMY") return state;
```

**9. "FOGGY also gives a WARNING alert"**
Affected: SET_WEATHER gets an `else if`.
```ts
if (action.payload === "STORMY") {
  newAlerts = state.alerts.concat(makeAlert("Severe storm detected! All flights hold altitude.", "DANGER"));
} else if (action.payload === "FOGGY") {
  newAlerts = state.alerts.concat(makeAlert("Low visibility. Reduce speed.", "WARNING"));
}
```

**10. "Clearing the weather removes all alerts"**
Affected: SET_WEATHER sets `alerts` to an empty list.
```ts
if (action.payload === "CLEAR") {
  newAlerts = [];
}
```

**11. "The low-fuel warning appears only once (when it crosses 20)"**
Affected: the condition compares the OLD value and the NEW value.
```ts
} else if (target.fuelPercent >= 20 && newFuel < 20 && target.status === "IN_FLIGHT") {
```

**12. "Keep only the last 3 alerts"**
Affected: one line before the return.
```ts
newAlerts = newAlerts.slice(-3);
```

**13. "Destination is required and cannot be a duplicate"**
Affected: early returns at the top of ADD_FLIGHT.
```ts
case "ADD_FLIGHT": {
  const destination = action.payload.destination.trim();
  if (destination === "") return state;
  if (state.flights.some((flight) => flight.destination === destination)) return state;
  // ... the normal newFlight code, using destination
}
```

**14. "Remove a flight" (new action) - and the selection must not point to it anymore**
Affected: a new Action line, a new case that changes TWO fields, and a new button.
```ts
| { type: "REMOVE_FLIGHT"; payload: string }
```
```ts
case "REMOVE_FLIGHT":
  return {
    ...state,
    flights: state.flights.filter((flight) => flight.id !== action.payload),
    selectedFlightId: state.selectedFlightId === action.payload ? "" : state.selectedFlightId,
  };
```
```tsx
<button onClick={() => dispatch({ type: "REMOVE_FLIGHT", payload: flight.id })}>Remove</button>
```

**15. "A new flight is selected automatically"**
Affected: ADD_FLIGHT also changes `selectedFlightId`.
```ts
return { ...state, flights: state.flights.concat(newFlight), selectedFlightId: newFlight.id };
```

---

# Part 5 - Testing the rules

## 15. Test by clicking
Make a table from the rules and click through it. For SkyControl:

| Do this | Expected | Rule it tests |
|---|---|---|
| FL-101, click +2000 eight times | stops at 45000 | max limit |
| FL-204 (0 ft), click -2000 | stays 0 | min limit |
| FL-204, click +2000 | 2000 ft, IN_FLIGHT | altitude above 0 -> IN_FLIGHT |
| FL-101, status LANDED | 0 ft | LANDED -> altitude 0 |
| FL-309 (15%), Burn 5% | 10% + WARNING | below 20 while IN_FLIGHT |
| FL-309, keep burning | stops at 0 + DANGER | never below 0, fuel 0 -> DANGER |
| FL-412 (LANDED, 40%), Burn 20% then Burn 5% | 15%, no banner | WARNING only while IN_FLIGHT |
| click STORMY | storm DANGER banner | STORMY -> alert |
| click Dismiss | the banner disappears | DISMISS_ALERT |

## 16. Quick console check
Put this in the reducer while testing, and remove it before you submit:
```ts
const fleetReducer = (state: State, action: Action): State => {
  console.log(action.type, action);
  switch (action.type) {
```
Open the browser console (F12) and click. If the action appears but the screen does not change,
the problem is in the case. If nothing appears, the problem is in the dispatch or the button.
