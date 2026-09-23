// WeatherToolbar.tsx - weather selection buttons + "New Flight" input form
import { useContext, useState } from "react";
import { FleetContext } from "../context/FleetContext";

const WEATHER_OPTIONS = ["CLEAR", "STORMY", "FOGGY"];

export const WeatherToolbar: React.FC = () => {
  const context = useContext(FleetContext);
  if (!context) throw new Error("WeatherToolbar must be used within FleetProvider");
  const { state, dispatch } = context;

  // the input is only needed here -> local state (not global)
  const [destination, setDestination] = useState("");

  const handleAddFlight = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: "ADD_FLIGHT", payload: { destination } });
    setDestination("");
  };

  return (
    <div>
      <p>
        Weather: <strong>{state.weatherCondition}</strong>{" "}
        {WEATHER_OPTIONS.map((weather) => (
          <button
            key={weather}
            onClick={() => dispatch({ type: "SET_WEATHER", payload: weather })}
            disabled={state.weatherCondition === weather}
          >
            {weather}
          </button>
        ))}
      </p>

      <form onSubmit={handleAddFlight}>
        <input
          placeholder="New flight destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          required
        />{" "}
        <button type="submit">Add flight</button>
      </form>
    </div>
  );
};
